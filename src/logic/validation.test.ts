import { test, describe } from 'node:test'
import assert from 'node:assert'
import { isValidGameAction, isValidTradeOffer } from './validation.ts'

describe('isValidTradeOffer', () => {
  test('should validate a correct trade offer', () => {
    const offer = {
      myCash: 100,
      partnerCash: 200,
      myProperties: [1, 2],
      partnerProperties: [3],
    }
    assert.strictEqual(isValidTradeOffer(offer), true)
  })

  test('should reject negative cash', () => {
    const offer = {
      myCash: -100,
      partnerCash: 200,
      myProperties: [],
      partnerProperties: [],
    }
    assert.strictEqual(isValidTradeOffer(offer), false)
  })

  test('should reject non-integer properties', () => {
    const offer = {
      myCash: 100,
      partnerCash: 200,
      myProperties: [1.5],
      partnerProperties: [],
    }
    assert.strictEqual(isValidTradeOffer(offer), false)
  })

  test('should reject non-array properties', () => {
    const offer = {
      myCash: 100,
      partnerCash: 200,
      myProperties: '1',
      partnerProperties: [],
    }
    assert.strictEqual(isValidTradeOffer(offer), false)
  })
})

describe('isValidGameAction', () => {
  test('should validate simple actions', () => {
    assert.strictEqual(isValidGameAction({ type: 'ROLL' }), true)
    assert.strictEqual(isValidGameAction({ type: 'END_TURN' }), true)
  })

  test('should validate actions with payloads', () => {
    assert.strictEqual(isValidGameAction({ type: 'BUY_HOUSE', tileId: 5 }), true)
    assert.strictEqual(isValidGameAction({ type: 'CHAT', message: 'Hello' }), true)
  })

  test('should reject invalid action types', () => {
    assert.strictEqual(isValidGameAction({ type: 'INVALID_ACTION' }), false)
  })

  test('should reject malformed payloads', () => {
    assert.strictEqual(isValidGameAction({ type: 'BUY_HOUSE', tileId: '5' }), false)
    assert.strictEqual(isValidGameAction({ type: 'CHAT', message: 123 }), false)
  })

  test('should validate trade proposals', () => {
    const action = {
      type: 'PROPOSE_TRADE',
      partnerId: 'peer2',
      offer: {
        myCash: 100,
        partnerCash: 0,
        myProperties: [1],
        partnerProperties: [],
      },
    }
    assert.strictEqual(isValidGameAction(action), true)
  })

  test('should reject malformed trade proposals', () => {
    const action = {
      type: 'PROPOSE_TRADE',
      partnerId: 'peer2',
      offer: {
        myCash: -100, // Invalid
        partnerCash: 0,
        myProperties: [1],
        partnerProperties: [],
      },
    }
    assert.strictEqual(isValidGameAction(action), false)
  })
})
