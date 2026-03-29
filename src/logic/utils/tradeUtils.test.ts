import { test, describe } from 'node:test'
import assert from 'node:assert'
import { validateTrade, applyTradeToPlayers } from './tradeUtils.ts'
import { createMockPlayer } from '../testUtils.ts'
import type { TradeOffer } from '../../types/game.ts'

describe('tradeUtils', () => {
  describe('validateTrade', () => {
    test('should return invalid if either player is missing', () => {
      const p1 = createMockPlayer({ id: 'p1', balance: 1000 })
      const trade: TradeOffer = {
        fromId: 'p1',
        toId: 'p2',
        myCash: 100,
        partnerCash: 0,
        myProperties: [],
        partnerProperties: [],
      }

      const result1 = validateTrade(p1, undefined, trade)
      assert.strictEqual(result1.valid, false)
      assert.strictEqual(result1.error, 'Trade failed: One or both players not found.')

      const result2 = validateTrade(undefined, p1, trade)
      assert.strictEqual(result2.valid, false)
      assert.strictEqual(result2.error, 'Trade failed: One or both players not found.')
    })

    test('should return invalid if p1 has insufficient funds', () => {
      const p1 = createMockPlayer({ id: 'p1', balance: 50 })
      const p2 = createMockPlayer({ id: 'p2', balance: 1000 })
      const trade: TradeOffer = {
        fromId: 'p1',
        toId: 'p2',
        myCash: 100, // Wants to trade 100, but only has 50
        partnerCash: 0,
        myProperties: [],
        partnerProperties: [],
      }

      const result = validateTrade(p1, p2, trade)
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.error, 'Trade failed: Insufficient funds.')
    })

    test('should return invalid if p2 has insufficient funds', () => {
      const p1 = createMockPlayer({ id: 'p1', balance: 1000 })
      const p2 = createMockPlayer({ id: 'p2', balance: 50 })
      const trade: TradeOffer = {
        fromId: 'p1',
        toId: 'p2',
        myCash: 0,
        partnerCash: 100, // Wants 100 from p2, but p2 only has 50
        myProperties: [],
        partnerProperties: [],
      }

      const result = validateTrade(p1, p2, trade)
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.error, 'Trade failed: Insufficient funds.')
    })

    test('should return invalid if p1 tries to trade properties they do not own', () => {
      const p1 = createMockPlayer({ id: 'p1', balance: 1000, properties: [1] })
      const p2 = createMockPlayer({ id: 'p2', balance: 1000, properties: [2] })
      const trade: TradeOffer = {
        fromId: 'p1',
        toId: 'p2',
        myCash: 0,
        partnerCash: 0,
        myProperties: [1, 3], // p1 does not own 3
        partnerProperties: [2],
      }

      const result = validateTrade(p1, p2, trade)
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.error, 'Trade failed: Properties not owned.')
    })

    test('should return invalid if p2 is asked to trade properties they do not own', () => {
      const p1 = createMockPlayer({ id: 'p1', balance: 1000, properties: [1] })
      const p2 = createMockPlayer({ id: 'p2', balance: 1000, properties: [2] })
      const trade: TradeOffer = {
        fromId: 'p1',
        toId: 'p2',
        myCash: 0,
        partnerCash: 0,
        myProperties: [1],
        partnerProperties: [2, 4], // p2 does not own 4
      }

      const result = validateTrade(p1, p2, trade)
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.error, 'Trade failed: Properties not owned.')
    })

    test('should return valid if both players have sufficient funds and properties', () => {
      const p1 = createMockPlayer({ id: 'p1', balance: 1000, properties: [1, 2] })
      const p2 = createMockPlayer({ id: 'p2', balance: 1000, properties: [3, 4] })
      const trade: TradeOffer = {
        fromId: 'p1',
        toId: 'p2',
        myCash: 100,
        partnerCash: 200,
        myProperties: [1],
        partnerProperties: [4],
      }

      const result = validateTrade(p1, p2, trade)
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.error, undefined)
    })
  })

  describe('applyTradeToPlayers', () => {
    test('should correctly apply trade cash and properties to the involved players', () => {
      const p1 = createMockPlayer({ id: 'p1', balance: 1000, properties: [1, 2] })
      const p2 = createMockPlayer({ id: 'p2', balance: 1000, properties: [3, 4] })
      const p3 = createMockPlayer({ id: 'p3', balance: 1000, properties: [5] })

      const trade: TradeOffer = {
        fromId: 'p1',
        toId: 'p2',
        myCash: 100, // p1 gives 100
        partnerCash: 200, // p2 gives 200
        myProperties: [1], // p1 gives 1
        partnerProperties: [4], // p2 gives 4
      }

      const players = [p1, p2, p3]
      const result = applyTradeToPlayers(players, trade)

      // p1 logic check: balance = 1000 - 100 + 200 = 1100
      // p1 properties: loses 1, gets 4 -> [2, 4]
      const resultingP1 = result.find((p) => p.id === 'p1')!
      assert.strictEqual(resultingP1.balance, 1100)
      assert.deepStrictEqual(resultingP1.properties, [2, 4])

      // p2 logic check: balance = 1000 - 200 + 100 = 900
      // p2 properties: loses 4, gets 1 -> [3, 1]
      const resultingP2 = result.find((p) => p.id === 'p2')!
      assert.strictEqual(resultingP2.balance, 900)
      assert.deepStrictEqual(resultingP2.properties, [3, 1])
    })

    test('should not mutate players not involved in the trade', () => {
      const p1 = createMockPlayer({ id: 'p1', balance: 1000, properties: [1] })
      const p2 = createMockPlayer({ id: 'p2', balance: 1000, properties: [2] })
      const p3 = createMockPlayer({ id: 'p3', balance: 1000, properties: [3] })

      const trade: TradeOffer = {
        fromId: 'p1',
        toId: 'p2',
        myCash: 0,
        partnerCash: 0,
        myProperties: [],
        partnerProperties: [],
      }

      const players = [p1, p2, p3]
      const result = applyTradeToPlayers(players, trade)

      const resultingP3 = result.find((p) => p.id === 'p3')!
      assert.strictEqual(resultingP3, p3) // Referential equality
    })
  })
})
