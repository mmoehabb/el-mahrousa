import { test, describe, mock } from 'node:test'
import assert from 'node:assert'

import {
  rollDice,
  moveOneStep,
  createInitialState,
  applyLandingLogic,
  endTurn,
  buyProperty,
  handleBankrupt,
  buyHouse,
  sellHouse,
  sellProperty,
  proposeTrade,
  acceptTrade,
  rejectTrade,
  cancelTrade,
} from './gameLogic.ts'
import type { GameState, Player, TradeOffer } from '../types/game.ts'
import { createMockPlayer, createMockTile, createMockState } from './testUtils.ts'

const proposeAndAcceptTrade = (state: GameState, p1Id: string, p2Id: string, offer: TradeOffer) => {
  const tempState = proposeTrade(state, p1Id, p2Id, offer)
  const tradeId = tempState.trades[0].id!
  return acceptTrade(tempState, tradeId)
}

import { GAME_CONFIG } from '../config/gameConfig.ts'

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

describe('proposeAndAcceptTrade', () => {
  test('should correctly exchange cash and properties between two players', () => {
    const p1 = createMockPlayer({ id: 'p1', name: 'Player p1', balance: 1000, properties: [1, 2] })
    const p2 = createMockPlayer({ id: 'p2', name: 'Player p2', balance: 500, properties: [3, 4] })
    const state = createMockState([p1, p2])

    const offer: TradeOffer = {
      myCash: 200, // p1 gives 200
      partnerCash: 0, // p2 gives 0
      myProperties: [1], // p1 gives property 1
      partnerProperties: [3, 4], // p2 gives properties 3 and 4
    }

    const newState = proposeAndAcceptTrade(state, 'p1', 'p2', offer)

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
    assert.strictEqual(newState.logs[0], 'Trade executed between Player p1 and Player p2')
  })

  test('should handle cash-only trades', () => {
    const p1 = createMockPlayer({ id: 'p1', name: 'Player p1', balance: 1000, properties: [1, 2] })
    const p2 = createMockPlayer({ id: 'p2', name: 'Player p2', balance: 500, properties: [3, 4] })
    const state = createMockState([p1, p2])

    const offer: TradeOffer = {
      myCash: 100,
      partnerCash: 300,
      myProperties: [],
      partnerProperties: [],
    }

    const newState = proposeAndAcceptTrade(state, 'p1', 'p2', offer)

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
    const p1 = createMockPlayer({ id: 'p1', name: 'Player p1', balance: 1000, properties: [1, 2] })
    const p2 = createMockPlayer({ id: 'p2', name: 'Player p2', balance: 500, properties: [3, 4] })
    const state = createMockState([p1, p2])

    const offer: TradeOffer = {
      myCash: 0,
      partnerCash: 0,
      myProperties: [1, 2],
      partnerProperties: [3],
    }

    const newState = proposeAndAcceptTrade(state, 'p1', 'p2', offer)

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
    const p1 = createMockPlayer({ id: 'p1', balance: 1000, properties: [1] })
    const p2 = createMockPlayer({ id: 'p2', balance: 500, properties: [2] })
    const p3 = createMockPlayer({ id: 'p3', balance: 1500, properties: [3] })
    const state = createMockState([p1, p2, p3])

    const offer: TradeOffer = {
      myCash: 100,
      partnerCash: 0,
      myProperties: [1],
      partnerProperties: [],
    }

    const newState = proposeAndAcceptTrade(state, 'p1', 'p2', offer)

    const newP3 = newState.players.find((p) => p.id === 'p3')
    assert.ok(newP3)

    assert.strictEqual(newP3.balance, 1500)
    assert.deepStrictEqual(newP3.properties, [3])
  })
})

describe('endTurn', () => {
  test('should transition to the next player', () => {
    const state = createMockState(
      [createMockPlayer({ id: '1' }), createMockPlayer({ id: '2' }), createMockPlayer({ id: '3' })],
      undefined,
      { currentPlayerIndex: 0 },
    )

    const newState = endTurn(state)
    assert.strictEqual(newState.currentPlayerIndex, 1)
    assert.strictEqual(newState.turnPhase, 'ROLL')
  })

  test('should wrap around to the first player', () => {
    const state = createMockState(
      [createMockPlayer({ id: '1' }), createMockPlayer({ id: '2' }), createMockPlayer({ id: '3' })],
      undefined,
      { currentPlayerIndex: 2 },
    )

    const newState = endTurn(state)
    assert.strictEqual(newState.currentPlayerIndex, 0)
    assert.strictEqual(newState.turnPhase, 'ROLL')
  })

  test('should skip a bankrupt player', () => {
    const state = createMockState(
      [
        createMockPlayer({ id: '1' }),
        createMockPlayer({ id: '2', isBankrupt: true }),
        createMockPlayer({ id: '3' }),
      ],
      undefined,
      { currentPlayerIndex: 0 },
    )

    const newState = endTurn(state)
    assert.strictEqual(newState.currentPlayerIndex, 2)
  })

  test('should wrap around and skip a bankrupt player', () => {
    const state = createMockState(
      [
        createMockPlayer({ id: '1', isBankrupt: true }),
        createMockPlayer({ id: '2' }),
        createMockPlayer({ id: '3' }),
      ],
      undefined,
      { currentPlayerIndex: 2 },
    )

    const newState = endTurn(state)
    assert.strictEqual(newState.currentPlayerIndex, 1)
  })

  test('should return to same player if all others are bankrupt', () => {
    const state = createMockState(
      [
        createMockPlayer({ id: '1' }),
        createMockPlayer({ id: '2', isBankrupt: true }),
        createMockPlayer({ id: '3', isBankrupt: true }),
      ],
      undefined,
      { currentPlayerIndex: 0 },
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
        avatar: 'merchant',
        isBankrupt: false,
        color: '#f00',
      },
      {
        id: 'p2',
        name: 'Player 2',
        position: 0,
        balance: 1500,
        properties: [],
        avatar: 'merchant',
        isBankrupt: false,
        color: '#0f0',
      },
      {
        id: 'p3',
        name: 'Player 3',
        position: 0,
        balance: 1500,
        properties: [],
        avatar: 'merchant',
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
        avatar: 'merchant',
        isBankrupt: false,
        color: '#f00',
      },
      {
        id: 'p2',
        name: 'Player 2',
        position: 0,
        balance: 1500,
        properties: [],
        avatar: 'merchant',
        isBankrupt: false,
        color: '#0f0',
      },
    ]
    state.currentPlayerIndex = 0
    return state
  }

  test('deducts dynamic Income Tax from player balance when landing on Income Tax', () => {
    const state = getBaseState()

    const taxTileIndex = state.tiles.findIndex((t) => t.name === 'Income Tax')
    assert.notStrictEqual(taxTileIndex, -1, 'Board must have at least one Income Tax tile')

    state.players[0].balance = 1500
    state.players[0].properties = []
    state.players[0].position = taxTileIndex

    const newState = applyLandingLogic(state)

    // Tax should be Math.floor(1500 * 0.025 + 0) = 37
    assert.strictEqual(newState.players[0].balance, 1500 - 37)
    assert.strictEqual(newState.turnPhase, 'END')
    assert.ok(newState.logs.length > state.logs.length)
  })

  test('deducts dynamic Super Tax from player balance when landing on Super Tax', () => {
    const state = getBaseState()

    const taxTileIndex = state.tiles.findIndex((t) => t.name === 'Super Tax')
    assert.notStrictEqual(taxTileIndex, -1, 'Board must have at least one Super Tax tile')

    state.players[0].balance = 1500
    state.players[0].properties = [1, 2] // 2 properties
    state.players[0].position = taxTileIndex

    const newState = applyLandingLogic(state)

    // Tax should be Math.floor(1500 * 0.05 + 1500 * 2 * 0.01) = 75 + 30 = 105
    assert.strictEqual(newState.players[0].balance, 1500 - 105)
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

    const actualPrisonIndex = state.tiles.findIndex((t) => t.name === 'Prison')
    assert.notStrictEqual(actualPrisonIndex, -1, 'Board must have "Prison" tile')

    state.players[0].position = prisonTileIndex

    const newState = applyLandingLogic(state)

    assert.strictEqual(newState.players[0].position, actualPrisonIndex)
    assert.deepStrictEqual(newState.prison[state.players[0].id], { turnsLeft: 2 })
    assert.strictEqual(newState.turnPhase, 'END')
  })

  test('prevents player from ending turn if they are in debt (must sell or bankrupt)', () => {
    const state = getBaseState()
    state.turnPhase = 'ACTION' // Mocking what it might be before

    // Player 1 has 10 balance
    state.players[0].balance = 10

    // Find property tile
    const propertyTileIndex = state.tiles.findIndex((t) => t.type === 'PROPERTY')

    // Deep clone the tiles array to avoid polluting global state
    state.tiles = state.tiles.map((t) => ({ ...t }))
    const propertyTile = state.tiles[propertyTileIndex]

    // Set high rent to cause debt
    propertyTile.rent = [200, 200, 200, 200, 200, 200]

    // Make player 2 own it
    state.players[1].properties = [propertyTile.id]

    state.players[0].position = propertyTileIndex

    const newState = applyLandingLogic(state)

    // Player lost money, but their turn phase didn't transition to END
    assert.strictEqual(newState.players[0].balance, -190)
    assert.strictEqual(newState.turnPhase, 'ACTION')
  })

  test('strips all properties from a player when they declare bankruptcy', () => {
    const state = getBaseState()
    state.players[0].properties = [1, 2]

    const newState = handleBankrupt(state, 'p1')

    assert.strictEqual(newState.players[0].isBankrupt, true)
    assert.strictEqual(newState.players[0].balance, 0)
    assert.deepStrictEqual(newState.players[0].properties, [])
  })

  test('pays rent calculated by 25 * 2^(count - 1) when landing on an owned AIRPORT or UTILITY', () => {
    const state = getBaseState()

    const mockTiles = state.tiles.map((t) => ({ ...t }))

    const airport1Index = mockTiles.findIndex((t) => t.type === 'AIRPORT')
    assert.notStrictEqual(airport1Index, -1, 'Board must have at least one AIRPORT tile')

    const utility1Index = mockTiles.findIndex((t) => t.type === 'UTILITY')
    assert.notStrictEqual(utility1Index, -1, 'Board must have at least one UTILITY tile')

    const allAirports = mockTiles.filter((t) => t.type === 'AIRPORT')
    const allUtilities = mockTiles.filter((t) => t.type === 'UTILITY')

    const airport1 = allAirports[0]
    const utility1 = allUtilities[0]

    // Player 2 owns 1 airport and 1 utility
    state.players[1].properties = [airport1.id, utility1.id]
    state.tiles = mockTiles

    state.players[0].position = mockTiles.findIndex((t) => t.id === airport1.id)

    const newState = applyLandingLogic(state)

    // Player 2 owns 2 tiles of these types, so rent should be 25 * 2^(2 - 1) = 50
    assert.strictEqual(newState.players[0].balance, 1500 - 50)
    assert.strictEqual(newState.players[1].balance, 1500 + 50)
    assert.strictEqual(newState.turnPhase, 'END')
  })

  test('makes properties available for purchase after bankrupt player is stripped of them', () => {
    let state = getBaseState()
    const propTileIndex = state.tiles.findIndex((t) => t.type === 'PROPERTY')

    // Deep clone tiles to safely mutate state for the test
    state.tiles = state.tiles.map((t) => ({ ...t }))
    const propTile = state.tiles[propTileIndex]

    // Player 1 buys it originally
    state.players[0].properties = [propTile.id]

    // Player 1 goes bankrupt
    state = handleBankrupt(state, 'p1')

    // Now it's Player 2's turn
    state.currentPlayerIndex = 1
    state.players[1].position = propTileIndex

    // Player 2 attempts to buy the same property
    state = buyProperty(state, propTile.id)

    // Verify Player 2 now owns the property
    assert.ok(state.players[1].properties.includes(propTile.id))
  })
})

describe('buyProperty', () => {
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
    activeEvent: null,
    trades: [],
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

describe('proposeAndAcceptTrade', () => {
  test('should execute a valid trade', () => {
    const p1 = createMockPlayer({ id: 'p1', name: 'Player 1', balance: 1000, properties: [1, 2] })
    const p2 = createMockPlayer({ id: 'p2', name: 'Player 2', balance: 1500, properties: [3, 4] })
    const state = createMockState([p1, p2])
    const offer = {
      myCash: 200,
      partnerCash: 100,
      myProperties: [1],
      partnerProperties: [3],
    }

    const newState = proposeAndAcceptTrade(state, 'p1', 'p2', offer)

    const newP1 = newState.players.find((p) => p.id === 'p1')!
    const newP2 = newState.players.find((p) => p.id === 'p2')!

    assert.strictEqual(newP1.balance, 1000 - 200 + 100)
    assert.deepStrictEqual(newP1.properties, [2, 3])

    assert.strictEqual(newP2.balance, 1500 - 100 + 200)
    assert.deepStrictEqual(newP2.properties, [4, 1])

    assert.strictEqual(newState.logs[0], 'Trade executed between Player 1 and Player 2')
  })

  test('should fail if p1 has insufficient funds', () => {
    const p1 = createMockPlayer({ id: 'p1', name: 'Player 1', balance: 1000, properties: [1, 2] })
    const p2 = createMockPlayer({ id: 'p2', name: 'Player 2', balance: 1500, properties: [3, 4] })
    const state = createMockState([p1, p2])
    const offer = {
      myCash: 2000, // p1 only has 1000
      partnerCash: 0,
      myProperties: [],
      partnerProperties: [],
    }

    const newState = proposeAndAcceptTrade(state, 'p1', 'p2', offer)

    const newP1 = newState.players.find((p) => p.id === 'p1')!
    assert.strictEqual(newP1.balance, 1000) // unchanged
    assert.strictEqual(newState.logs[0], 'Trade failed: Insufficient funds.')
  })

  test('should fail if p2 has insufficient funds', () => {
    const p1 = createMockPlayer({ id: 'p1', name: 'Player 1', balance: 1000, properties: [1, 2] })
    const p2 = createMockPlayer({ id: 'p2', name: 'Player 2', balance: 1500, properties: [3, 4] })
    const state = createMockState([p1, p2])
    const offer = {
      myCash: 0,
      partnerCash: 2000, // p2 only has 1500
      myProperties: [],
      partnerProperties: [],
    }

    const newState = proposeAndAcceptTrade(state, 'p1', 'p2', offer)

    const newP2 = newState.players.find((p) => p.id === 'p2')!
    assert.strictEqual(newP2.balance, 1500) // unchanged
    assert.strictEqual(newState.logs[0], 'Trade failed: Insufficient funds.')
  })

  test('should fail if p1 offers unowned property', () => {
    const p1 = createMockPlayer({ id: 'p1', name: 'Player 1', balance: 1000, properties: [1, 2] })
    const p2 = createMockPlayer({ id: 'p2', name: 'Player 2', balance: 1500, properties: [3, 4] })
    const state = createMockState([p1, p2])
    const offer = {
      myCash: 0,
      partnerCash: 0,
      myProperties: [5], // p1 does not own 5
      partnerProperties: [],
    }

    const newState = proposeAndAcceptTrade(state, 'p1', 'p2', offer)

    const newP1 = newState.players.find((p) => p.id === 'p1')!
    assert.deepStrictEqual(newP1.properties, [1, 2]) // unchanged
    assert.strictEqual(newState.logs[0], 'Trade failed: Properties not owned.')
  })

  test('should fail if p2 offers unowned property', () => {
    const p1 = createMockPlayer({ id: 'p1', name: 'Player 1', balance: 1000, properties: [1, 2] })
    const p2 = createMockPlayer({ id: 'p2', name: 'Player 2', balance: 1500, properties: [3, 4] })
    const state = createMockState([p1, p2])
    const offer = {
      myCash: 0,
      partnerCash: 0,
      myProperties: [],
      partnerProperties: [1], // p2 does not own 1
    }

    const newState = proposeAndAcceptTrade(state, 'p1', 'p2', offer)

    const newP2 = newState.players.find((p) => p.id === 'p2')!
    assert.deepStrictEqual(newP2.properties, [3, 4]) // unchanged
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
          avatar: 'merchant',
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
          avatar: 'merchant',
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
          avatar: 'merchant',
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

describe('buyHouse', () => {
  const createMockTile = (
    overrides: Partial<import('../types/game.ts').Tile> = {},
  ): import('../types/game.ts').Tile => ({
    id: 1,
    name: 'Property 1',
    type: 'PROPERTY',
    price: 100,
    housePrice: 50,
    rent: [10, 50, 150],
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
    turnPhase: 'ROLL',
    lastDice: [1, 1],
    logs: [],
    chatMessages: [],
    prison: {},
    trades: [],
    ...overrides,
    activeEvent: overrides.activeEvent || null,
  })

  test('should not allow buying a house if player does not own all properties in the group', () => {
    const player = createMockPlayer({ balance: 500, properties: [1] }) // only owns tile 1
    const tile1 = createMockTile({ id: 1, group: 'A' })
    const tile2 = createMockTile({ id: 2, group: 'A' }) // tile 2 is in same group
    const state = createMockState([player], [createMockTile({ id: 0 }), tile1, tile2])

    const newState = buyHouse(state, 1)

    // Should return exact same state since action is invalid
    assert.strictEqual(newState, state)
  })

  test('should allow buying a house if player owns all properties in the group', () => {
    const player = createMockPlayer({ balance: 500, properties: [1, 2] }) // owns both
    const tile1 = createMockTile({ id: 1, group: 'A' })
    const tile2 = createMockTile({ id: 2, group: 'A' })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile1, tile2])

    const newState = buyHouse(state, 1)

    // Should return new state with updated balance and houses
    assert.notStrictEqual(newState, state)
    assert.strictEqual(newState.players[0].balance, 450) // 500 - 50 (house price)
    assert.strictEqual(newState.tiles[1].houses, 1)
  })

  test('should allow buying a house if property has no group', () => {
    const player = createMockPlayer({ balance: 500, properties: [1] })
    const tile1 = createMockTile({ id: 1, group: undefined })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile1])

    const newState = buyHouse(state, 1)

    assert.notStrictEqual(newState, state)
    assert.strictEqual(newState.players[0].balance, 450)
    assert.strictEqual(newState.tiles[1].houses, 1)
  })
})

describe('rejectTrade', () => {
  const createMockPlayer = (id: string, name: string): Player => ({
    id,
    name,
    position: 0,
    balance: 1000,
    properties: [],
    avatar: 'merchant',
    isBankrupt: false,
    color: '#000000',
  })

  const createMockStateWithTrades = (
    players: Player[],
    trades: import('../types/game.ts').TradeOffer[],
  ): GameState => ({
    players,
    currentPlayerIndex: 0,
    tiles: [],
    status: 'PLAYING',
    turnPhase: 'ACTION',
    lastDice: [1, 1],
    logs: ['Initial state'],
    chatMessages: [],
    prison: {},
    activeEvent: null,
    trades,
  })

  test('should successfully reject a PENDING trade and append the correct log', () => {
    const p1 = createMockPlayer('p1', 'Player One')
    const p2 = createMockPlayer('p2', 'Player Two')

    const trade: import('../types/game.ts').TradeOffer = {
      id: 'trade-123',
      fromId: 'p1', // Proposer
      toId: 'p2', // Rejecter
      status: 'PENDING',
      myCash: 100,
      partnerCash: 0,
      myProperties: [],
      partnerProperties: [],
    }

    const state = createMockStateWithTrades([p1, p2], [trade])

    const newState = rejectTrade(state, 'trade-123')

    assert.notStrictEqual(newState, state) // New state reference
    assert.strictEqual(newState.trades.length, 1)
    assert.strictEqual(newState.trades[0].status, 'REJECTED')
    assert.strictEqual(newState.logs.length, 2) // "Initial state" + new log
    assert.deepStrictEqual(newState.logs[0], {
      key: 'tradeRejected',
      params: { name: 'Player Two', partner: 'Player One' },
    })
  })

  test('should return exact same state if tradeId does not exist', () => {
    const state = createMockStateWithTrades([], [])

    const newState = rejectTrade(state, 'invalid-id')

    assert.strictEqual(newState, state)
  })

  test('should return exact same state if trade is not PENDING', () => {
    const p1 = createMockPlayer('p1', 'Player One')
    const p2 = createMockPlayer('p2', 'Player Two')

    const trade: import('../types/game.ts').TradeOffer = {
      id: 'trade-123',
      fromId: 'p1',
      toId: 'p2',
      status: 'ACCEPTED',
      myCash: 100,
      partnerCash: 0,
      myProperties: [],
      partnerProperties: [],
    }

    const state = createMockStateWithTrades([p1, p2], [trade])

    const newState = rejectTrade(state, 'trade-123')

    assert.strictEqual(newState, state) // Should return exact same state reference
  })
})

describe('handleBankrupt', () => {
  test('strips all properties from a player and sets balance to 0 when they declare bankruptcy', () => {
    const initialState = createInitialState()
    const player1: Player = {
      id: 'p1',
      name: 'Player 1',
      color: 'red',
      position: 0,
      balance: 100,
      properties: [1, 3],
      avatar: 'merchant',
      isBankrupt: false,
    }
    const player2: Player = {
      id: 'p2',
      name: 'Player 2',
      color: 'blue',
      position: 0,
      balance: 1500,
      properties: [],
      avatar: 'merchant',
      isBankrupt: false,
    }
    initialState.players = [player1, player2]
    initialState.tiles[1] = { ...initialState.tiles[1], houses: 2 }
    initialState.tiles[3] = { ...initialState.tiles[3], houses: 1 }
    initialState.tiles[2] = { ...initialState.tiles[2], houses: 3 } // another player's or unowned property
    initialState.currentPlayerIndex = 0

    const nextState = handleBankrupt(initialState, 'p1')

    assert.strictEqual(nextState.players[0].isBankrupt, true)
    assert.strictEqual(nextState.players[0].balance, 0)
    assert.deepStrictEqual(nextState.players[0].properties, [])

    // Test that the properties are unowned
    assert.strictEqual(
      nextState.players.some((p) => p.properties.includes(1)),
      false,
    )
    assert.strictEqual(
      nextState.players.some((p) => p.properties.includes(3)),
      false,
    )

    // Test that houses on owned properties are removed
    assert.strictEqual(nextState.tiles[1].houses, 0)
    assert.strictEqual(nextState.tiles[3].houses, 0)

    // Test that houses on unowned/other properties are NOT removed
    assert.strictEqual(nextState.tiles[2].houses, 3)
  })
})

describe('sellProperty', () => {
  const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: 'p1',
    name: 'Player 1',
    position: 0,
    balance: 1500,
    properties: [],
    avatar: 'merchant',
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
    price: 200,
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
    turnPhase: 'ROLL',
    lastDice: [1, 1],
    logs: [],
    chatMessages: [],
    prison: {},
    trades: [],
    ...overrides,
    activeEvent: overrides.activeEvent || null,
  })

  test('should successfully sell a property and refund 50% of the price', () => {
    const player = createMockPlayer({ balance: 1000, properties: [1] })
    const tile = createMockTile({ id: 1, price: 200 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile])

    const newState = sellProperty(state, 1)

    assert.notStrictEqual(newState, state)
    assert.strictEqual(newState.players[0].balance, 1100) // 1000 + 100
    assert.deepStrictEqual(newState.players[0].properties, [])
    assert.strictEqual(newState.logs.length, 1)
    const log = newState.logs[0] as { key: string; params: Record<string, string | number> }
    assert.strictEqual(log.key, 'soldProperty')
  })

  test('should allow selling property if turnPhase is ACTION', () => {
    const player = createMockPlayer({ balance: 1000, properties: [1] })
    const tile = createMockTile({ id: 1, price: 200 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile], {
      turnPhase: 'ACTION',
    })

    const newState = sellProperty(state, 1)

    assert.notStrictEqual(newState, state)
    assert.strictEqual(newState.players[0].balance, 1100) // 1000 + 100
  })

  test('should not allow selling property if turnPhase is not ROLL or ACTION', () => {
    const player = createMockPlayer({ balance: 1000, properties: [1] })
    const tile = createMockTile({ id: 1, price: 200 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile], {
      turnPhase: 'MOVING',
    })

    const newState = sellProperty(state, 1)

    assert.strictEqual(newState, state)
  })

  test('should not allow selling property if player does not own it', () => {
    const player = createMockPlayer({ balance: 1000, properties: [] })
    const tile = createMockTile({ id: 1, price: 200 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile])

    const newState = sellProperty(state, 1)

    assert.strictEqual(newState, state)
  })

  test('should not allow selling property if it has houses', () => {
    const player = createMockPlayer({ balance: 1000, properties: [1] })
    const tile = createMockTile({ id: 1, price: 200, houses: 1 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile])

    const newState = sellProperty(state, 1)

    assert.strictEqual(newState, state)
  })

  test('should not allow selling property if it has no price', () => {
    const player = createMockPlayer({ balance: 1000, properties: [1] })
    const tile = createMockTile({ id: 1, price: undefined })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile])

    const newState = sellProperty(state, 1)

    assert.strictEqual(newState, state)
  })
})

describe('sellHouse', () => {
  test('should successfully sell a house and refund 50% of the price', () => {
    const player = createMockPlayer({ balance: 1000, properties: [1] })
    // With houses: 1, price refund: (100 * 2^(1-1)) / 2 = 50
    const tile = createMockTile({ id: 1, houses: 1, housePrice: 100 })

    const state = createMockState([player], [createMockTile({ id: 0 }), tile])
    const newState = sellHouse(state, 1)

    assert.notStrictEqual(newState, state)

    assert.strictEqual(newState.players[0].balance, 1050)
    assert.strictEqual(newState.tiles[1].houses, 0)
  })

  test('should successfully sell a house and refund for higher house level', () => {
    // Current houses: 3, housePrice: 50
    // Refund: (50 * Math.pow(2, 3 - 1)) / 2 = (50 * 4) / 2 = 100
    const player = createMockPlayer({ properties: [1], balance: 500 })
    const tile = createMockTile({ id: 1, housePrice: 50, houses: 3 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile])

    const newState = sellHouse(state, 1)

    assert.notStrictEqual(newState, state)
    // Decreased house count
    assert.strictEqual(newState.tiles[1].houses, 2)
    // Refund = 100, New balance = 500 + 100 = 600
    assert.strictEqual(newState.players[0].balance, 600)
  })

  test('should allow selling house if turnPhase is ACTION', () => {
    const player = createMockPlayer({ balance: 1000, properties: [1] })
    const tile = createMockTile({ id: 1, housePrice: 50, houses: 1 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile], {
      turnPhase: 'ACTION',
    })

    const newState = sellHouse(state, 1)

    assert.notStrictEqual(newState, state)
    assert.strictEqual(newState.players[0].balance, 1025)
  })

  test('should return original state if turnPhase is not ROLL or ACTION', () => {
    const player = createMockPlayer({ properties: [1] })
    const tile = createMockTile({ id: 1, housePrice: 50, houses: 1 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile], {
      turnPhase: 'MOVING',
    })

    const newState = sellHouse(state, 1)

    assert.strictEqual(newState, state)
  })

  test('should successfully sell multiple houses in sequence and handle exponential refund', () => {
    const player = createMockPlayer({ balance: 1000, properties: [1] })
    // With houses: 2, price refund: (100 * 2^(2-1)) / 2 = 100
    const tile = createMockTile({ id: 1, houses: 2, housePrice: 100 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile])

    const stateAfterFirstSale = sellHouse(state, 1)
    assert.strictEqual(stateAfterFirstSale.players[0].balance, 1100)
    assert.strictEqual(stateAfterFirstSale.tiles[1].houses, 1)

    // With houses: 1, price refund: (100 * 2^(1-1)) / 2 = 50
    const stateAfterSecondSale = sellHouse(stateAfterFirstSale, 1)
    assert.strictEqual(stateAfterSecondSale.players[0].balance, 1150)
    assert.strictEqual(stateAfterSecondSale.tiles[1].houses, 0)
  })

  test('should not allow selling house if turnPhase is not ROLL or ACTION', () => {
    const player = createMockPlayer({ properties: [1] })
    const tile = createMockTile({ id: 1, houses: 1 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile], {
      turnPhase: 'MOVING',
    })

    const newState = sellHouse(state, 1)

    assert.strictEqual(newState, state)
  })

  test('should return original state if player does not own the tile', () => {
    const player = createMockPlayer({ properties: [] })
    const tile = createMockTile({ id: 1, housePrice: 50, houses: 1 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile])

    const newState = sellHouse(state, 1)

    assert.strictEqual(newState, state)
  })

  test('should not allow selling house if player does not own property', () => {
    const player = createMockPlayer({ properties: [] })
    const tile = createMockTile({ id: 1, houses: 1 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile])

    const newState = sellHouse(state, 1)

    assert.strictEqual(newState, state)
  })

  test('should return original state if tile has no housePrice', () => {
    const player = createMockPlayer({ properties: [1] })
    // Missing housePrice
    const tile = createMockTile({ id: 1, housePrice: undefined, houses: 1 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile])

    const newState = sellHouse(state, 1)

    assert.strictEqual(newState, state)
  })

  test('should not allow selling house if property has no houses', () => {
    const player = createMockPlayer({ properties: [1] })
    const tile = createMockTile({ id: 1, houses: 0 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile])

    const newState = sellHouse(state, 1)

    assert.strictEqual(newState, state)
  })

  test('should return original state if tile has 0 houses', () => {
    const player = createMockPlayer({ properties: [1] })
    const tile = createMockTile({ id: 1, housePrice: 50, houses: 0 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile])

    const newState = sellHouse(state, 1)

    assert.strictEqual(newState, state)
  })

  test('should not allow selling house if property has no housePrice', () => {
    const player = createMockPlayer({ properties: [1] })
    const tile = createMockTile({ id: 1, houses: 1, housePrice: undefined })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile])

    const newState = sellHouse(state, 1)

    assert.strictEqual(newState, state)
  })
})

describe('cancelTrade', () => {
  const createMockTrade = (
    id: string,
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' = 'PENDING',
  ): TradeOffer => ({
    id,
    fromId: 'p1',
    toId: 'p2',
    status,
    myCash: 100,
    partnerCash: 0,
    myProperties: [],
    partnerProperties: [],
  })

  test('should cancel a PENDING trade successfully', () => {
    const tradeId = 'trade-1'
    const trade = createMockTrade(tradeId)
    const state = createMockState([])
    state.trades = [trade]
    state.logs = ['Initial state']

    const newState = cancelTrade(state, tradeId)

    assert.notStrictEqual(newState, state)
    assert.deepStrictEqual(newState.trades, [])
    assert.strictEqual(newState.logs[0], 'A trade offer was canceled.')
    assert.strictEqual(newState.logs.length, 2)
  })

  test('should return unmodified state if trade does not exist', () => {
    const tradeId = 'trade-1'
    const trade = createMockTrade(tradeId)
    const state = createMockState([])
    state.trades = [trade]

    const newState = cancelTrade(state, 'non-existent-trade-id')

    assert.strictEqual(newState, state)
  })

  test('should return unmodified state if trade status is not PENDING', () => {
    const tradeId = 'trade-1'
    const trade = createMockTrade(tradeId, 'ACCEPTED')
    const state = createMockState([])
    state.trades = [trade]

    const newState = cancelTrade(state, tradeId)

    assert.strictEqual(newState, state)
  })
})
