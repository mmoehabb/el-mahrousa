import { test, describe, mock } from 'node:test'
import assert from 'node:assert'
import { rollDice, executeTrade } from './gameLogic.ts'
import type { GameState, Player } from '../types/game.ts'
import type { TradeOffer } from '../components/TradeModal.tsx'

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
    assert.strictEqual(newState.logs[0], 'Trade executed between p1 and p2')
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
