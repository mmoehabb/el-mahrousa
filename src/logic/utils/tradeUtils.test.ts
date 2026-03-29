import { test, describe } from 'node:test'
import assert from 'node:assert'
import { validateTrade } from './tradeUtils.ts'
import { createMockPlayer } from '../testUtils.ts'
import type { TradeOffer } from '../../types/game.ts'

describe('validateTrade', () => {
  test('should return valid for a correct trade', () => {
    const p1 = createMockPlayer({ id: 'p1', balance: 500, properties: [1, 2] })
    const p2 = createMockPlayer({ id: 'p2', balance: 500, properties: [3, 4] })

    const trade: TradeOffer = {
      myCash: 100,
      partnerCash: 200,
      myProperties: [1],
      partnerProperties: [3],
    }

    const result = validateTrade(p1, p2, trade)
    assert.strictEqual(result.valid, true)
    assert.strictEqual(result.error, undefined)
  })

  test('should return invalid if a player is missing', () => {
    const p1 = createMockPlayer()
    const trade: TradeOffer = { myCash: 0, partnerCash: 0, myProperties: [], partnerProperties: [] }

    const result1 = validateTrade(undefined, p1, trade)
    assert.strictEqual(result1.valid, false)

    const result2 = validateTrade(p1, undefined, trade)
    assert.strictEqual(result2.valid, false)

    const result3 = validateTrade(undefined, undefined, trade)
    assert.strictEqual(result3.valid, false)
  })

  test('should return invalid if p1 has insufficient funds', () => {
    const p1 = createMockPlayer({ id: 'p1', balance: 50, properties: [] })
    const p2 = createMockPlayer({ id: 'p2', balance: 500, properties: [] })

    const trade: TradeOffer = {
      myCash: 100, // p1 offers 100 but only has 50
      partnerCash: 0,
      myProperties: [],
      partnerProperties: [],
    }

    const result = validateTrade(p1, p2, trade)
    assert.strictEqual(result.valid, false)
  })

  test('should return invalid if p2 has insufficient funds', () => {
    const p1 = createMockPlayer({ id: 'p1', balance: 500, properties: [] })
    const p2 = createMockPlayer({ id: 'p2', balance: 50, properties: [] })

    const trade: TradeOffer = {
      myCash: 0,
      partnerCash: 100, // asks p2 for 100 but they only have 50
      myProperties: [],
      partnerProperties: [],
    }

    const result = validateTrade(p1, p2, trade)
    assert.strictEqual(result.valid, false)
  })

  test('should allow trade if player is in debt but offers 0 cash', () => {
    const p1 = createMockPlayer({ id: 'p1', balance: -200, properties: [1] })
    const p2 = createMockPlayer({ id: 'p2', balance: 500, properties: [] })

    const trade: TradeOffer = {
      myCash: 0, // p1 offers 0 cash
      partnerCash: 100, // asks p2 for 100
      myProperties: [1],
      partnerProperties: [],
    }

    const result = validateTrade(p1, p2, trade)
    assert.strictEqual(result.valid, true)
  })

  test('should return invalid if p1 does not own offered properties', () => {
    const p1 = createMockPlayer({ id: 'p1', balance: 500, properties: [1] }) // only owns 1
    const p2 = createMockPlayer({ id: 'p2', balance: 500, properties: [] })

    const trade: TradeOffer = {
      myCash: 0,
      partnerCash: 0,
      myProperties: [1, 2], // offers 1 and 2
      partnerProperties: [],
    }

    const result = validateTrade(p1, p2, trade)
    assert.strictEqual(result.valid, false)
  })

  test('should return invalid if p2 does not own requested properties', () => {
    const p1 = createMockPlayer({ id: 'p1', balance: 500, properties: [] })
    const p2 = createMockPlayer({ id: 'p2', balance: 500, properties: [3] }) // only owns 3

    const trade: TradeOffer = {
      myCash: 0,
      partnerCash: 0,
      myProperties: [],
      partnerProperties: [3, 4], // asks for 3 and 4
    }

    const result = validateTrade(p1, p2, trade)
    assert.strictEqual(result.valid, false)
  })
})
