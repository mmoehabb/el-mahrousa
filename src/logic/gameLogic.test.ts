import { test, describe, mock } from 'node:test'
import assert from 'node:assert'
import { rollDice, buyProperty } from './gameLogic.ts'
import type { GameState, Player, Tile } from '../types/game.ts'

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

  const createMockTile = (overrides: Partial<Tile> = {}): Tile => ({
    id: 1,
    name: 'Property 1',
    type: 'PROPERTY',
    price: 100,
    ...overrides,
  })

  const createMockState = (
    players: Player[],
    tiles: Tile[],
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
    const state = createMockState(
      [player1, player2],
      [createMockTile({ id: 0, price: 0 }), tile],
    )

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
