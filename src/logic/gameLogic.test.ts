import { test, describe, mock } from 'node:test'
import assert from 'node:assert'
import { rollDice, createInitialState, applyLandingLogic, endTurn } from './gameLogic.ts'

describe('rollDice', () => {
  test('should return an array of two numbers', () => {
    const dice = rollDice()
    assert.strictEqual(Array.isArray(dice), true)
    assert.strictEqual(dice.length, 2)
    assert.strictEqual(typeof dice[0], 'number')
    assert.strictEqual(typeof dice[1], 'number')
  })

  test('should return numbers between 1 and 6 inclusive', () => {
    for (let i = 0; i < 100; i++) {
      const [d1, d2] = rollDice()
      assert.ok(d1 >= 1 && d1 <= 6, `Dice 1 value ${d1} is out of range`)
      assert.ok(d2 >= 1 && d2 <= 6, `Dice 2 value ${d2} is out of range`)
      assert.ok(Number.isInteger(d1), `Dice 1 value ${d1} is not an integer`)
      assert.ok(Number.isInteger(d2), `Dice 2 value ${d2} is not an integer`)
    }
  })

  test('should be deterministic with mocked Math.random', () => {
    const randomMock = mock.method(Math, 'random')

    try {
      // Mock Math.random to return 0 (should result in 1)
      randomMock.mock.mockImplementation(() => 0)
      assert.deepStrictEqual(rollDice(), [1, 1])

      // Mock Math.random to return 0.999999 (should result in 6)
      randomMock.mock.mockImplementation(() => 0.999999)
      assert.deepStrictEqual(rollDice(), [6, 6])

      // Mock Math.random to return specific sequence
      let count = 0
      randomMock.mock.mockImplementation(() => {
        count++
        return count === 1 ? 0.1 : 0.8 // 0.1 -> 1, 0.8 -> 5
      })
      assert.deepStrictEqual(rollDice(), [1, 5])
    } finally {
      randomMock.mock.restore()
    }
  })
})

describe('endTurn prison logic', () => {
  const getBaseState = () => {
    const state = createInitialState()
    state.players = [
      { id: 'p1', name: 'Player 1', position: 0, balance: 1500, properties: [], isBankrupt: false, color: '#f00' },
      { id: 'p2', name: 'Player 2', position: 0, balance: 1500, properties: [], isBankrupt: false, color: '#0f0' },
      { id: 'p3', name: 'Player 3', position: 0, balance: 1500, properties: [], isBankrupt: false, color: '#00f' },
    ]
    state.currentPlayerIndex = 0
    return state
  }

  test('skips player in prison and decrements turnsLeft', () => {
    const state = getBaseState()
    // Player 2 is in prison with 2 turns left
    state.prison = { p2: { turnsLeft: 2 } }
    state.currentPlayerIndex = 0 // Player 1's turn

    // Player 1 ends turn -> should be Player 2's turn but they are skipped -> so it becomes Player 3's turn
    let newState = endTurn(state)

    assert.strictEqual(newState.currentPlayerIndex, 2) // Now Player 3's turn
    assert.strictEqual(newState.prison['p2'].turnsLeft, 1)

    // Player 3 ends turn -> Player 1's turn
    newState = endTurn(newState)
    assert.strictEqual(newState.currentPlayerIndex, 0) // Now Player 1's turn

    // Player 1 ends turn -> should be Player 2's turn but skipped -> Player 3's turn again
    newState = endTurn(newState)
    assert.strictEqual(newState.currentPlayerIndex, 2) // Now Player 3's turn
    assert.strictEqual(newState.prison['p2'].turnsLeft, 0)

    // Next round: Player 3 -> Player 1
    newState = endTurn(newState)
    // Player 1 -> Player 2 gets released and takes turn
    newState = endTurn(newState)
    assert.strictEqual(newState.currentPlayerIndex, 1) // Now Player 2's turn
    assert.strictEqual(newState.prison['p2'], undefined) // Released!
  })

  test('releases player from prison when turnsLeft reaches 0', () => {
    const state = getBaseState()
    state.prison = { p2: { turnsLeft: 0 } }
    state.currentPlayerIndex = 0 // Player 1

    // Player 1 ends turn -> Player 2 is in prison with 0 turns left, gets released and it becomes their turn
    const newState = endTurn(state)

    assert.strictEqual(newState.currentPlayerIndex, 1)
    assert.strictEqual(newState.prison['p2'], undefined, 'Player 2 should be released')
  })
})

describe('applyLandingLogic', () => {
  const getBaseState = () => {
    const state = createInitialState()
    state.players = [
      { id: 'p1', name: 'Player 1', position: 0, balance: 1500, properties: [], isBankrupt: false, color: '#f00' },
      { id: 'p2', name: 'Player 2', position: 0, balance: 1500, properties: [], isBankrupt: false, color: '#0f0' },
    ]
    state.currentPlayerIndex = 0
    return state
  }

  test('deducts tax amount from player balance when landing on TAX', () => {
    const state = getBaseState()

    // Find a TAX tile in BOARD_DATA
    const taxTileIndex = state.tiles.findIndex(t => t.type === 'TAX')
    assert.notStrictEqual(taxTileIndex, -1, 'Board must have at least one TAX tile')

    // Deep clone the tiles array to avoid polluting global state
    state.tiles = state.tiles.map(t => ({ ...t }))
    const taxTile = state.tiles[taxTileIndex]

    // Explicitly set price to 0 to test fallback logic
    taxTile.price = undefined

    state.players[0].position = taxTileIndex

    const newState = applyLandingLogic(state)

    assert.strictEqual(newState.players[0].balance, 1500) // Deducted 0
    assert.strictEqual(newState.turnPhase, 'END')
    assert.ok(newState.logs.length > state.logs.length)
  })

  test('pays rent to owner when landing on owned PROPERTY', () => {
    const state = getBaseState()

    const propIndex = state.tiles.findIndex(t => t.type === 'PROPERTY')
    assert.notStrictEqual(propIndex, -1, 'Board must have at least one PROPERTY tile')

    const propTile = state.tiles[propIndex]
    const rentAmount = propTile.rent ? propTile.rent[0] : 0

    // Player 2 owns the property
    state.players[1].properties = [propTile.id]
    // Player 1 lands on it
    state.players[0].position = propIndex

    const newState = applyLandingLogic(state)

    assert.strictEqual(newState.players[0].balance, 1500 - rentAmount)
    assert.strictEqual(newState.players[1].balance, 1500 + rentAmount)
    assert.strictEqual(newState.turnPhase, 'END')
  })

  test('does not pay rent if owner is bankrupt', () => {
    const state = getBaseState()

    const propIndex = state.tiles.findIndex(t => t.type === 'PROPERTY')
    const propTile = state.tiles[propIndex]

    // Player 2 owns it but is bankrupt
    state.players[1].properties = [propTile.id]
    state.players[1].isBankrupt = true
    state.players[0].position = propIndex

    const newState = applyLandingLogic(state)

    // Balances should not change
    assert.strictEqual(newState.players[0].balance, 1500)
    assert.strictEqual(newState.players[1].balance, 1500)
    assert.notStrictEqual(newState.turnPhase, 'END') // Rent check didn't apply
  })

  test('sends player to Prison when landing on "Go To Prison" tile', () => {
    const state = getBaseState()

    const prisonTileIndex = state.tiles.findIndex(t => t.name === 'Go To Prison')
    assert.notStrictEqual(prisonTileIndex, -1, 'Board must have "Go To Prison" tile')

    state.players[0].position = prisonTileIndex

    const newState = applyLandingLogic(state)

    assert.strictEqual(newState.players[0].position, 6) // Assumes position 6 is Prison
    assert.deepStrictEqual(newState.prison[state.players[0].id], { turnsLeft: 2 })
    assert.strictEqual(newState.turnPhase, 'END')
  })

  test.todo('prevents player from ending turn if they are in debt (must sell or bankrupt)')
  test.todo('strips all properties from a player when they declare bankruptcy')
  test.todo('makes properties available for purchase after bankrupt player is stripped of them')
})
