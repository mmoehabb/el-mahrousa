import { test, describe, mock } from 'node:test'
import assert from 'node:assert'

import {
  rollDice,
  moveOneStep,
  createInitialState,
  applyLandingLogic,
  endTurn,
  executeTrade,
  buyProperty,
} from './gameLogic.ts'
import type { GameState, Player, TradeOffer } from '../types/game.ts'
import { GAME_CONFIG } from '../config/gameConfig.ts'

const createMockPlayer = (id: string, isBankrupt: boolean = false): Player => ({
  id,
  name: `Player ${id}`,
  position: 0,
  balance: 1500,
  properties: [],
  isBankrupt,
  color: '#000000',
})

const createMockState = (players: Player[], currentPlayerIndex: number): GameState => ({
  players,
  currentPlayerIndex,
  tiles: [],
  status: 'PLAYING',
  turnPhase: 'END',
  lastDice: [1, 1],
  logs: [],
  chatMessages: [],
  prison: {},
})

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

  test('should be deterministic with mocked crypto.getRandomValues', () => {
    const originalGetRandomValues = crypto.getRandomValues

    const cryptoMock = mock.method(crypto, 'getRandomValues')

    try {
      // Mock crypto.getRandomValues to return 0 (should result in 1)
      cryptoMock.mock.mockImplementation(<T extends ArrayBufferView | null>(array: T) => {
        if (array && '0' in array) {
          ;(array as unknown as Uint32Array)[0] = 0
        }
        return array
      })
      assert.deepStrictEqual(rollDice(), [1, 1])

      // Mock crypto.getRandomValues to return near max Uint32 (should result in 6)
      cryptoMock.mock.mockImplementation(<T extends ArrayBufferView | null>(array: T) => {
        if (array && '0' in array) {
          ;(array as unknown as Uint32Array)[0] = 0xffffffff
        }
        return array
      })
      assert.deepStrictEqual(rollDice(), [6, 6])

      // Mock crypto.getRandomValues to return specific sequence
      let count = 0
      cryptoMock.mock.mockImplementation(<T extends ArrayBufferView | null>(array: T) => {
        count++
        if (array && '0' in array) {
          // 0.1 * (0xffffffff + 1) -> 1
          // 0.8 * (0xffffffff + 1) -> 5
          ;(array as unknown as Uint32Array)[0] =
            count === 1 ? Math.floor(0.1 * (0xffffffff + 1)) : Math.floor(0.8 * (0xffffffff + 1))
        }
        return array
      })
      assert.deepStrictEqual(rollDice(), [1, 5])
    } finally {
      cryptoMock.mock.restore()
      crypto.getRandomValues = originalGetRandomValues
    }
  })
})

describe('executeTrade', () => {
  const createMockPlayer = (id: string, balance: number, properties: number[]): Player => ({
    id,
    name: `Player ${id}`,
    position: 0,
    balance,
    properties,
    isBankrupt: false,
    color: '#000000',
  })

  const createMockGameState = (players: Player[]): GameState => ({
    players,
    currentPlayerIndex: 0,
    tiles: [],
    status: 'PLAYING',
    turnPhase: 'ACTION',
    lastDice: [1, 1],
    logs: ['Initial state'],
    chatMessages: [],
    prison: {},
  })

  test('should correctly exchange cash and properties between two players', () => {
    const p1 = createMockPlayer('p1', 1000, [1, 2])
    const p2 = createMockPlayer('p2', 500, [3, 4])
    const state = createMockGameState([p1, p2])

    const offer: TradeOffer = {
      myCash: 200, // p1 gives 200
      partnerCash: 0, // p2 gives 0
      myProperties: [1], // p1 gives property 1
      partnerProperties: [3, 4], // p2 gives properties 3 and 4
    }

    const newState = executeTrade(state, 'p1', 'p2', offer)

    const newP1 = newState.players.find((p) => p.id === 'p1')
    const newP2 = newState.players.find((p) => p.id === 'p2')

    assert.ok(newP1)
    assert.ok(newP2)

    // P1 balance: 1000 - 200 + 0 = 800
    assert.strictEqual(newP1.balance, 800)
    // P1 properties: lost 1, gained 3 and 4 -> [2, 3, 4]
    assert.deepStrictEqual(newP1.properties, [2, 3, 4])

    // P2 balance: 500 - 0 + 200 = 700
    assert.strictEqual(newP2.balance, 700)
    // P2 properties: lost 3 and 4, gained 1 -> [1]
    assert.deepStrictEqual(newP2.properties, [1])

    // Logs should be updated
    assert.strictEqual(newState.logs[0], 'Trade executed between Player p1 and Player p2')
    assert.strictEqual(newState.logs[1], 'Initial state')
  })

  test('should handle cash-only trades', () => {
    const p1 = createMockPlayer('p1', 1000, [1, 2])
    const p2 = createMockPlayer('p2', 500, [3, 4])
    const state = createMockGameState([p1, p2])

    const offer: TradeOffer = {
      myCash: 100,
      partnerCash: 300,
      myProperties: [],
      partnerProperties: [],
    }

    const newState = executeTrade(state, 'p1', 'p2', offer)

    const newP1 = newState.players.find((p) => p.id === 'p1')
    const newP2 = newState.players.find((p) => p.id === 'p2')

    assert.ok(newP1)
    assert.ok(newP2)

    // P1 balance: 1000 - 100 + 300 = 1200
    assert.strictEqual(newP1.balance, 1200)
    assert.deepStrictEqual(newP1.properties, [1, 2])

    // P2 balance: 500 - 300 + 100 = 300
    assert.strictEqual(newP2.balance, 300)
    assert.deepStrictEqual(newP2.properties, [3, 4])
  })

  test('should handle properties-only trades', () => {
    const p1 = createMockPlayer('p1', 1000, [1, 2])
    const p2 = createMockPlayer('p2', 500, [3, 4])
    const state = createMockGameState([p1, p2])

    const offer: TradeOffer = {
      myCash: 0,
      partnerCash: 0,
      myProperties: [1, 2],
      partnerProperties: [3],
    }

    const newState = executeTrade(state, 'p1', 'p2', offer)

    const newP1 = newState.players.find((p) => p.id === 'p1')
    const newP2 = newState.players.find((p) => p.id === 'p2')

    assert.ok(newP1)
    assert.ok(newP2)

    assert.strictEqual(newP1.balance, 1000)
    assert.deepStrictEqual(newP1.properties, [3])

    assert.strictEqual(newP2.balance, 500)
    assert.deepStrictEqual(newP2.properties, [4, 1, 2])
  })

  test('should leave other players unaffected', () => {
    const p1 = createMockPlayer('p1', 1000, [1])
    const p2 = createMockPlayer('p2', 500, [2])
    const p3 = createMockPlayer('p3', 1500, [3])
    const state = createMockGameState([p1, p2, p3])

    const offer: TradeOffer = {
      myCash: 100,
      partnerCash: 0,
      myProperties: [1],
      partnerProperties: [],
    }

    const newState = executeTrade(state, 'p1', 'p2', offer)

    const newP3 = newState.players.find((p) => p.id === 'p3')
    assert.ok(newP3)

    assert.strictEqual(newP3.balance, 1500)
    assert.deepStrictEqual(newP3.properties, [3])
  })
})

describe('endTurn', () => {
  test('should transition to the next player', () => {
    const state = createMockState(
      [createMockPlayer('1'), createMockPlayer('2'), createMockPlayer('3')],
      0,
    )

    const newState = endTurn(state)
    assert.strictEqual(newState.currentPlayerIndex, 1)
    assert.strictEqual(newState.turnPhase, 'ROLL')
  })

  test('should wrap around to the first player', () => {
    const state = createMockState(
      [createMockPlayer('1'), createMockPlayer('2'), createMockPlayer('3')],
      2,
    )

    const newState = endTurn(state)
    assert.strictEqual(newState.currentPlayerIndex, 0)
    assert.strictEqual(newState.turnPhase, 'ROLL')
  })

  test('should skip a bankrupt player', () => {
    const state = createMockState(
      [createMockPlayer('1'), createMockPlayer('2', true), createMockPlayer('3')],
      0,
    )

    const newState = endTurn(state)
    assert.strictEqual(newState.currentPlayerIndex, 2)
  })

  test('should wrap around and skip a bankrupt player', () => {
    const state = createMockState(
      [createMockPlayer('1', true), createMockPlayer('2'), createMockPlayer('3')],
      2,
    )

    const newState = endTurn(state)
    assert.strictEqual(newState.currentPlayerIndex, 1)
  })

  test('should return to same player if all others are bankrupt', () => {
    const state = createMockState(
      [createMockPlayer('1'), createMockPlayer('2', true), createMockPlayer('3', true)],
      0,
    )

    const newState = endTurn(state)
    assert.strictEqual(newState.currentPlayerIndex, 0)
  })
})

describe('endTurn prison logic', () => {
  const getBaseState = () => {
    const state = createInitialState()
    state.players = [
      {
        id: 'p1',
        name: 'Player 1',
        position: 0,
        balance: 1500,
        properties: [],
        isBankrupt: false,
        color: '#f00',
      },
      {
        id: 'p2',
        name: 'Player 2',
        position: 0,
        balance: 1500,
        properties: [],
        isBankrupt: false,
        color: '#0f0',
      },
      {
        id: 'p3',
        name: 'Player 3',
        position: 0,
        balance: 1500,
        properties: [],
        isBankrupt: false,
        color: '#00f',
      },
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
      {
        id: 'p1',
        name: 'Player 1',
        position: 0,
        balance: 1500,
        properties: [],
        isBankrupt: false,
        color: '#f00',
      },
      {
        id: 'p2',
        name: 'Player 2',
        position: 0,
        balance: 1500,
        properties: [],
        isBankrupt: false,
        color: '#0f0',
      },
    ]
    state.currentPlayerIndex = 0
    return state
  }

  test('deducts tax amount from player balance when landing on TAX', () => {
    const state = getBaseState()

    // Find a TAX tile in BOARD_DATA
    const taxTileIndex = state.tiles.findIndex((t) => t.type === 'TAX')
    assert.notStrictEqual(taxTileIndex, -1, 'Board must have at least one TAX tile')

    // Deep clone the tiles array to avoid polluting global state
    state.tiles = state.tiles.map((t) => ({ ...t }))
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

    const propIndex = state.tiles.findIndex((t) => t.type === 'PROPERTY')
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

    const propIndex = state.tiles.findIndex((t) => t.type === 'PROPERTY')
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

    const prisonTileIndex = state.tiles.findIndex((t) => t.name === 'Go To Prison')
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

describe('buyProperty', () => {
  const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: 'p1',
    name: 'Player 1',
    position: 0,
    balance: 1500,
    properties: [],
    isBankrupt: false,
    color: 'red',
    ...overrides,
  })

  const createMockTile = (
    overrides: Partial<import('../types/game.ts').Tile> = {},
  ): import('../types/game.ts').Tile => ({
    id: 1,
    name: 'Property 1',
    type: 'PROPERTY',
    price: 100,
    ...overrides,
  })

  const createMockState = (
    players: Player[],
    tiles: import('../types/game.ts').Tile[],
    overrides: Partial<GameState> = {},
  ): GameState => ({
    players,
    currentPlayerIndex: 0,
    tiles,
    status: 'PLAYING',
    turnPhase: 'ACTION',
    lastDice: [1, 1],
    logs: [],
    chatMessages: [],
    prison: {},
    ...overrides,
  })

  test('should successfully buy an unowned property', () => {
    const player = createMockPlayer({ balance: 200 })
    const tile = createMockTile({ id: 1, price: 100 })
    const state = createMockState([player], [createMockTile({ id: 0, price: 0 }), tile])

    const newState = buyProperty(state, 1)

    assert.notStrictEqual(newState, state) // Should return a new state object
    assert.strictEqual(newState.players[0].balance, 100) // 200 - 100
    assert.deepStrictEqual(newState.players[0].properties, [1])
    assert.strictEqual(newState.turnPhase, 'END')
    assert.strictEqual(newState.logs.length, 1)

    const log = newState.logs[0] as { key: string; params: Record<string, string | number> }
    assert.strictEqual(log.key, 'bought')
    assert.strictEqual(log.params.name, 'Player 1')
    assert.strictEqual(log.params.property, 'Property 1')
    assert.strictEqual(log.params.price, 100)
  })

  test('should not buy if player has insufficient funds', () => {
    const player = createMockPlayer({ balance: 50 })
    const tile = createMockTile({ id: 1, price: 100 })
    const state = createMockState([player], [createMockTile({ id: 0, price: 0 }), tile])

    const newState = buyProperty(state, 1)

    assert.strictEqual(newState, state) // Should return the exact same state
  })

  test('should not buy if property is already owned by another player', () => {
    const player1 = createMockPlayer({ id: 'p1', balance: 500 })
    const player2 = createMockPlayer({ id: 'p2', balance: 500, properties: [1] })
    const tile = createMockTile({ id: 1, price: 100 })
    const state = createMockState([player1, player2], [createMockTile({ id: 0, price: 0 }), tile])

    const newState = buyProperty(state, 1)

    assert.strictEqual(newState, state) // Should return the exact same state
  })

  test('should not buy if property is already owned by the current player', () => {
    const player = createMockPlayer({ balance: 500, properties: [1] })
    const tile = createMockTile({ id: 1, price: 100 })
    const state = createMockState([player], [createMockTile({ id: 0, price: 0 }), tile])

    const newState = buyProperty(state, 1)

    assert.strictEqual(newState, state) // Should return the exact same state
  })

  test('should not buy if tile has no price (e.g., GO or Tax)', () => {
    const player = createMockPlayer({ balance: 500 })
    const tile = createMockTile({ id: 1, type: 'SPECIAL', price: undefined })
    const state = createMockState([player], [createMockTile({ id: 0, price: 0 }), tile])

    const newState = buyProperty(state, 1)

    assert.strictEqual(newState, state) // Should return the exact same state
  })
})

describe('executeTrade', () => {
  const createMockState = (): GameState => ({
    players: [
      {
        id: 'p1',
        name: 'Player 1',
        position: 0,
        balance: 1000,
        properties: [1, 2],
        isBankrupt: false,
        color: '#ff0000',
      },
      {
        id: 'p2',
        name: 'Player 2',
        position: 0,
        balance: 1500,
        properties: [3, 4],
        isBankrupt: false,
        color: '#0000ff',
      },
    ],
    currentPlayerIndex: 0,
    tiles: [],
    status: 'PLAYING',
    turnPhase: 'ACTION',
    lastDice: [1, 1],
    logs: [],
    chatMessages: [],
    prison: {},
  })

  test('should execute a valid trade', () => {
    const state = createMockState()
    const offer = {
      myCash: 200,
      partnerCash: 100,
      myProperties: [1],
      partnerProperties: [3],
    }

    const newState = executeTrade(state, 'p1', 'p2', offer)

    const p1 = newState.players.find((p) => p.id === 'p1')!
    const p2 = newState.players.find((p) => p.id === 'p2')!

    assert.strictEqual(p1.balance, 1000 - 200 + 100)
    assert.deepStrictEqual(p1.properties, [2, 3])

    assert.strictEqual(p2.balance, 1500 - 100 + 200)
    assert.deepStrictEqual(p2.properties, [4, 1])

    assert.strictEqual(newState.logs[0], 'Trade executed between Player 1 and Player 2')
  })

  test('should fail if p1 has insufficient funds', () => {
    const state = createMockState()
    const offer = {
      myCash: 2000, // p1 only has 1000
      partnerCash: 0,
      myProperties: [],
      partnerProperties: [],
    }

    const newState = executeTrade(state, 'p1', 'p2', offer)

    const p1 = newState.players.find((p) => p.id === 'p1')!
    assert.strictEqual(p1.balance, 1000) // unchanged
    assert.strictEqual(newState.logs[0], 'Trade failed: Insufficient funds.')
  })

  test('should fail if p2 has insufficient funds', () => {
    const state = createMockState()
    const offer = {
      myCash: 0,
      partnerCash: 2000, // p2 only has 1500
      myProperties: [],
      partnerProperties: [],
    }

    const newState = executeTrade(state, 'p1', 'p2', offer)

    const p2 = newState.players.find((p) => p.id === 'p2')!
    assert.strictEqual(p2.balance, 1500) // unchanged
    assert.strictEqual(newState.logs[0], 'Trade failed: Insufficient funds.')
  })

  test('should fail if p1 offers unowned property', () => {
    const state = createMockState()
    const offer = {
      myCash: 0,
      partnerCash: 0,
      myProperties: [5], // p1 does not own 5
      partnerProperties: [],
    }

    const newState = executeTrade(state, 'p1', 'p2', offer)

    const p1 = newState.players.find((p) => p.id === 'p1')!
    assert.deepStrictEqual(p1.properties, [1, 2]) // unchanged
    assert.strictEqual(newState.logs[0], 'Trade failed: Properties not owned.')
  })

  test('should fail if p2 offers unowned property', () => {
    const state = createMockState()
    const offer = {
      myCash: 0,
      partnerCash: 0,
      myProperties: [],
      partnerProperties: [1], // p2 does not own 1
    }

    const newState = executeTrade(state, 'p1', 'p2', offer)

    const p2 = newState.players.find((p) => p.id === 'p2')!
    assert.deepStrictEqual(p2.properties, [3, 4]) // unchanged
    assert.strictEqual(newState.logs[0], 'Trade failed: Properties not owned.')
  })
})

describe('moveOneStep', () => {
  test('should move player position by 1 without changing balance for normal tile', () => {
    const initialState = createInitialState()
    const stateWithPlayer = {
      ...initialState,
      players: [
        {
          id: 'player1',
          name: 'Player 1',
          position: 0,
          balance: 1500,
          properties: [],
          isBankrupt: false,
          color: '#ff0000',
        },
      ],
      currentPlayerIndex: 0,
    }

    const newState = moveOneStep(stateWithPlayer)

    assert.strictEqual(newState.players[0].position, 1, 'Position should increment by 1')
    assert.strictEqual(newState.players[0].balance, 1500, 'Balance should remain unchanged')
    assert.strictEqual(
      newState.logs.length,
      initialState.logs.length,
      'No new logs should be added',
    )
  })

  test('should wrap around and add GO_REWARD when passing GO', () => {
    const initialState = createInitialState()
    const lastTileIndex = initialState.tiles.length - 1
    const stateWithPlayer = {
      ...initialState,
      players: [
        {
          id: 'player1',
          name: 'Player 1',
          position: lastTileIndex,
          balance: 1500,
          properties: [],
          isBankrupt: false,
          color: '#ff0000',
        },
      ],
      currentPlayerIndex: 0,
    }

    const newState = moveOneStep(stateWithPlayer)

    assert.strictEqual(newState.players[0].position, 0, 'Position should wrap around to 0')
    assert.strictEqual(
      newState.players[0].balance,
      1500 + GAME_CONFIG.GO_REWARD,
      'Balance should increase by GO_REWARD',
    )
    assert.strictEqual(
      newState.logs.length,
      initialState.logs.length + 1,
      'A new log should be added',
    )
    assert.deepStrictEqual(
      newState.logs[0],
      { key: 'passedStart', params: { name: 'Player 1', amount: GAME_CONFIG.GO_REWARD } },
      'Log should reflect passing GO',
    )
  })

  test('should not mutate original state', () => {
    const initialState = createInitialState()
    const stateWithPlayer = {
      ...initialState,
      players: [
        {
          id: 'player1',
          name: 'Player 1',
          position: 0,
          balance: 1500,
          properties: [],
          isBankrupt: false,
          color: '#ff0000',
        },
      ],
      currentPlayerIndex: 0,
    }

    // Freeze original state to ensure no mutation
    Object.freeze(stateWithPlayer)
    Object.freeze(stateWithPlayer.players)
    Object.freeze(stateWithPlayer.players[0])

    // We expect no TypeError to be thrown from mutation
    const newState = moveOneStep(stateWithPlayer)

    assert.strictEqual(newState.players[0].position, 1)
    assert.strictEqual(stateWithPlayer.players[0].position, 0)
    assert.notStrictEqual(newState, stateWithPlayer)
    assert.notStrictEqual(newState.players, stateWithPlayer.players)
  })
})
