import { test, describe, mock } from 'node:test'
import assert from 'node:assert'
import { rollDice, endTurn } from './gameLogic.ts'
import type { GameState, Player } from '../types/game.ts'

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
