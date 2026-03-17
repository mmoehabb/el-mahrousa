import { test, describe, mock } from 'node:test'
import assert from 'node:assert'
import { rollDice } from './gameLogic.ts'

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
