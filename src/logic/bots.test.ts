import { test, describe } from 'node:test'
import assert from 'node:assert'
import { getBotAction } from './bots.ts'
import { TileType } from '../types/game.ts'
import { createMockPlayer, createMockTile, createMockState } from './testUtils.ts'

describe('getBotAction', () => {
  test('should return null if the current player is not a bot', () => {
    const player = createMockPlayer({ isBot: false })
    const state = createMockState([player])
    assert.strictEqual(getBotAction(state), null)
  })

  test('should return null if the game status is not PLAYING', () => {
    const player = createMockPlayer({ isBot: true })
    const state = createMockState([player], undefined, { status: 'LOBBY' })
    assert.strictEqual(getBotAction(state), null)
  })

  describe('Trade Responses (Recipient)', () => {
    test('should ACCEPT_TRADE if it completes a color group for the bot', () => {
      const bot = createMockPlayer({ id: 'bot', isBot: true, properties: [1], balance: 1000 })
      const human = createMockPlayer({ id: 'human', isBot: false })
      const tiles = [
        createMockTile({ id: 0 }),
        createMockTile({ id: 1, group: 'A', price: 100 }),
        createMockTile({ id: 2, group: 'A', price: 100 }),
      ]
      const state = createMockState([bot, human], tiles)
      state.trades = [
        {
          id: 't1',
          fromId: 'human',
          toId: 'bot',
          status: 'PENDING',
          myCash: 0,
          partnerCash: 0,
          myProperties: [2],
          partnerProperties: [],
        },
      ]

      const action = getBotAction(state)
      assert.deepStrictEqual(action, { type: 'ACCEPT_TRADE', tradeId: 't1' })
    })

    test('should REJECT_TRADE if it breaks a color group for the bot', () => {
      const bot = createMockPlayer({ id: 'bot', isBot: true, properties: [1, 2], balance: 1000 })
      const human = createMockPlayer({ id: 'human', isBot: false })
      const tiles = [
        createMockTile({ id: 0 }),
        createMockTile({ id: 1, group: 'A', price: 100 }),
        createMockTile({ id: 2, group: 'A', price: 100 }),
      ]
      const state = createMockState([bot, human], tiles)
      state.trades = [
        {
          id: 't1',
          fromId: 'human',
          toId: 'bot',
          status: 'PENDING',
          myCash: 500,
          partnerCash: 0,
          myProperties: [],
          partnerProperties: [1],
        },
      ]

      const action = getBotAction(state)
      assert.deepStrictEqual(action, { type: 'REJECT_TRADE', tradeId: 't1' })
    })

    test('should ACCEPT_TRADE if bot gets more value', () => {
      const bot = createMockPlayer({ id: 'bot', isBot: true, properties: [], balance: 1000 })
      const human = createMockPlayer({ id: 'human', isBot: false, properties: [1] })
      const tiles = [createMockTile({ id: 0 }), createMockTile({ id: 1, price: 100 })]
      const state = createMockState([bot, human], tiles)
      state.trades = [
        {
          id: 't1',
          fromId: 'human',
          toId: 'bot',
          status: 'PENDING',
          myCash: 200,
          partnerCash: 0,
          myProperties: [1],
          partnerProperties: [],
        },
      ]

      const action = getBotAction(state)
      assert.deepStrictEqual(action, { type: 'ACCEPT_TRADE', tradeId: 't1' })
    })

    test('should REJECT_TRADE if it gives partner a complete color group and not attractive enough', () => {
      const bot = createMockPlayer({ id: 'bot', isBot: true, properties: [1], balance: 1000 })
      const human = createMockPlayer({ id: 'human', isBot: false, properties: [2] })
      const tiles = [
        createMockTile({ id: 0 }),
        createMockTile({ id: 1, group: 'A', price: 100 }),
        createMockTile({ id: 2, group: 'A', price: 100 }),
      ]
      const state = createMockState([bot, human], tiles)
      state.trades = [
        {
          id: 't1',
          fromId: 'human',
          toId: 'bot',
          status: 'PENDING',
          myCash: 100, // Not attractive enough for a danger trade
          partnerCash: 0,
          myProperties: [],
          partnerProperties: [1],
        },
      ]

      const action = getBotAction(state)
      assert.deepStrictEqual(action, { type: 'REJECT_TRADE', tradeId: 't1' })
    })
  })

  describe('Phase: ROLL', () => {
    test('should return BUY_HOUSE if bot owns a group and can afford it', () => {
      const bot = createMockPlayer({ id: 'bot', isBot: true, properties: [1, 2], balance: 1000 })
      const tiles = [
        createMockTile({ id: 0 }),
        createMockTile({ id: 1, group: 'A', housePrice: 100, rent: [10, 50, 100] }),
        createMockTile({ id: 2, group: 'A', housePrice: 100, rent: [10, 50, 100] }),
      ]
      const state = createMockState([bot], tiles, { turnPhase: 'ROLL' })

      const action = getBotAction(state)
      assert.deepStrictEqual(action, { type: 'BUY_HOUSE', tileId: 1 })
    })

    test('should return ROLL if no houses can be bought', () => {
      const bot = createMockPlayer({ id: 'bot', isBot: true, properties: [], balance: 1000 })
      const state = createMockState([bot], undefined, { turnPhase: 'ROLL' })

      const action = getBotAction(state)
      assert.deepStrictEqual(action, { type: 'ROLL' })
    })
  })

  test('Phase: ROLLING should return FINISH_ROLL', () => {
    const bot = createMockPlayer({ isBot: true })
    const state = createMockState([bot], undefined, { turnPhase: 'ROLLING' })
    assert.deepStrictEqual(getBotAction(state), { type: 'FINISH_ROLL' })
  })

  test('Phase: MOVING should return MOVE_STEP', () => {
    const bot = createMockPlayer({ isBot: true })
    const state = createMockState([bot], undefined, { turnPhase: 'MOVING' })
    assert.deepStrictEqual(getBotAction(state), { type: 'MOVE_STEP' })
  })

  describe('Phase: ACTION', () => {
    test('should return BUY if landing on unowned property and can afford (+200 buffer)', () => {
      const bot = createMockPlayer({ isBot: true, balance: 500, position: 1 })
      const tiles = [createMockTile({ id: 0 }), createMockTile({ id: 1, price: 100 })]
      const state = createMockState([bot], tiles, { turnPhase: 'ACTION' })

      const action = getBotAction(state)
      assert.deepStrictEqual(action, { type: 'BUY' })
    })

    test('should NOT return BUY if landing on unowned property but cannot afford buffer', () => {
      const bot = createMockPlayer({ isBot: true, balance: 250, position: 1 })
      const tiles = [createMockTile({ id: 0 }), createMockTile({ id: 1, price: 100 })]
      const state = createMockState([bot], tiles, { turnPhase: 'ACTION' })

      const action = getBotAction(state)
      assert.notStrictEqual(action?.type, 'BUY')
    })

    test('should return BANKRUPT if in debt and no assets to sell', () => {
      const bot = createMockPlayer({ isBot: true, balance: -100, properties: [] })
      const state = createMockState([bot], undefined, { turnPhase: 'ACTION' })

      const action = getBotAction(state)
      assert.deepStrictEqual(action, { type: 'BANKRUPT' })
    })

    test('should return SELL_HOUSE if in debt and has houses', () => {
      const bot = createMockPlayer({ isBot: true, balance: -100, properties: [1] })
      const tiles = [createMockTile({ id: 0 }), createMockTile({ id: 1, houses: 1, housePrice: 100 })]
      const state = createMockState([bot], tiles, { turnPhase: 'ACTION' })

      const action = getBotAction(state)
      assert.deepStrictEqual(action, { type: 'SELL_HOUSE', tileId: 1 })
    })

    test('should return SELL_PROPERTY if in debt and has properties but no houses', () => {
      const bot = createMockPlayer({ isBot: true, balance: -100, properties: [1] })
      const tiles = [createMockTile({ id: 0 }), createMockTile({ id: 1, price: 100, houses: 0 })]
      const state = createMockState([bot], tiles, { turnPhase: 'ACTION' })

      const action = getBotAction(state)
      assert.deepStrictEqual(action, { type: 'SELL_PROPERTY', tileId: 1 })
    })

    test('should return PROPOSE_TRADE if in debt and can sell to interested human player', () => {
      const bot = createMockPlayer({ id: 'bot', isBot: true, balance: -500, properties: [1] })
      const human = createMockPlayer({ id: 'human', isBot: false, properties: [2], balance: 1000 })
      const tiles = [
        createMockTile({ id: 0 }),
        createMockTile({ id: 1, group: 'A', price: 100 }),
        createMockTile({ id: 2, group: 'A', price: 100 }),
      ]
      const state = createMockState([bot, human], tiles, { turnPhase: 'ACTION' })

      const action = getBotAction(state)
      assert.strictEqual(action?.type, 'PROPOSE_TRADE')
      if (action?.type === 'PROPOSE_TRADE') {
        assert.strictEqual(action.partnerId, 'human')
        assert.strictEqual(action.offer.partnerCash, 600) // abs(-500) + 100
        assert.deepStrictEqual(action.offer.myProperties, [1])
      }
    })

    test('should PROPOSE_TRADE to complete a color group if has enough balance', () => {
      const bot = createMockPlayer({ id: 'bot', isBot: true, balance: 2000, properties: [1], position: 0 })
      const human = createMockPlayer({ id: 'human', isBot: false, properties: [2] })
      const tiles = [
        createMockTile({ id: 0, type: TileType.SPECIAL, price: undefined }), // Not buyable
        createMockTile({ id: 1, group: 'A', price: 100 }),
        createMockTile({ id: 2, group: 'A', price: 100 }),
      ]
      const state = createMockState([bot, human], tiles, { turnPhase: 'ACTION' })

      const action = getBotAction(state)
      assert.strictEqual(action?.type, 'PROPOSE_TRADE')
      if (action?.type === 'PROPOSE_TRADE') {
        assert.strictEqual(action.partnerId, 'human')
        assert.deepStrictEqual(action.offer.partnerProperties, [2])
      }
    })

    test('should return END_TURN if no other actions possible', () => {
      const bot = createMockPlayer({ isBot: true, balance: 1000, properties: [], position: 0 })
      const state = createMockState([bot], undefined, { turnPhase: 'ACTION' })

      const action = getBotAction(state)
      assert.deepStrictEqual(action, { type: 'END_TURN' })
    })
  })

  test('Phase: END should return END_TURN', () => {
    const bot = createMockPlayer({ isBot: true })
    const state = createMockState([bot], undefined, { turnPhase: 'END' })
    assert.deepStrictEqual(getBotAction(state), { type: 'END_TURN' })
  })
})
