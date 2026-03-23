import { test, describe } from 'node:test'
import assert from 'node:assert'
import { isValidGameAction, isValidTradeOffer, isValidGameState } from './validation.ts'

describe('isValidGameState', () => {
  test('should return true for valid game state', () => {
    const validState = {
      players: [
        {
          id: 'p1',
          name: 'Player 1',
          position: 0,
          balance: 1500,
          properties: [],
          isBankrupt: false,
          color: '#1034A6',
        },
      ],
      currentPlayerIndex: 0,
      tiles: [],
      status: 'WAITING',
      turnPhase: 'ROLL',
      lastDice: [1, 1],
      logs: [],
      chatMessages: [],
      prison: {},
      trades: [],
    }
    assert.strictEqual(isValidGameState(validState), true)
  })

  test('should return false for missing required fields', () => {
    const invalidState = {
      players: [],
      currentPlayerIndex: 0,
      tiles: [],
      // missing status, turnPhase, etc.
    }
    assert.strictEqual(isValidGameState(invalidState), false)
  })

  test('should return false for invalid player structure', () => {
    const invalidState = {
      players: [
        {
          id: 'p1',
          name: 'Player 1',
          // missing properties, etc.
        },
      ],
      currentPlayerIndex: 0,
      tiles: [],
      status: 'WAITING',
      turnPhase: 'ROLL',
      lastDice: [1, 1],
      logs: [],
      chatMessages: [],
      prison: {},
      trades: [],
    }
    assert.strictEqual(isValidGameState(invalidState), false)
  })

  test('should return false for invalid lastDice array length', () => {
    const invalidState = {
      players: [],
      currentPlayerIndex: 0,
      tiles: [],
      status: 'WAITING',
      turnPhase: 'ROLL',
      lastDice: [1, 1, 3], // invalid length
      logs: [],
      chatMessages: [],
      prison: {},
      trades: [],
    }
    assert.strictEqual(isValidGameState(invalidState), false)
  })
})

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
