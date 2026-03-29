import { describe, test } from 'node:test'
import assert from 'node:assert'
import {
  calculateRent,
  handleTaxLanding,
  handlePropertyLanding,
  handlePrisonLanding,
} from './landingUtils.ts'
import { TileType, type Tile, type Player, type GameState } from '../../types/game.ts'
import { createMockState, createMockPlayer, createMockTile } from '../testUtils.ts'

describe('handlePropertyLanding', () => {

})

describe('handleTaxLanding', () => {
  test('Income Tax without properties (2.5% of balance)', () => {
    const player = createMockPlayer({ balance: 1000, properties: [] })
    const tile: Tile = { id: 0, name: 'Income Tax', type: TileType.TAX }
    const state = createMockState(player, tile)

    const newState = handleTaxLanding(state)

    // 1000 * 0.025 = 25
    assert.strictEqual(newState.players[0].balance, 975)
    assert.strictEqual(newState.turnPhase, 'END')
    assert.strictEqual(newState.players[0].debtTo, undefined)
    const log = newState.logs[0] as { key: string; params: Record<string, string | number> }
    assert.strictEqual(log.key, 'paidTax')
    assert.strictEqual(log.params.amount, 25)
  })

  test('Income Tax with properties (2.5% of balance + 0.5% per property)', () => {
    const player = createMockPlayer({ balance: 1000, properties: [1, 2, 3] })
    const tile: Tile = { id: 0, name: 'Income Tax', type: TileType.TAX }
    const state = createMockState(player, tile)

    const newState = handleTaxLanding(state)

    // 1000 * 0.025 = 25
    // 1000 * 3 * 0.005 = 15
    // Total = 40
    assert.strictEqual(newState.players[0].balance, 960)
    assert.strictEqual(newState.turnPhase, 'END')
  })

  test('Super Tax without properties (5% of balance)', () => {
    const player = createMockPlayer({ balance: 1000, properties: [] })
    const tile: Tile = { id: 0, name: 'Super Tax', type: TileType.TAX }
    const state = createMockState(player, tile)

    const newState = handleTaxLanding(state)

    // 1000 * 0.05 = 50
    assert.strictEqual(newState.players[0].balance, 950)
    assert.strictEqual(newState.turnPhase, 'END')
  })

  test('Super Tax with properties (5% of balance + 1% per property)', () => {
    const player = createMockPlayer({ balance: 1000, properties: [1, 2, 3] })
    const tile: Tile = { id: 0, name: 'Super Tax', type: TileType.TAX }
    const state = createMockState(player, tile)

    const newState = handleTaxLanding(state)

    // 1000 * 0.05 = 50
    // 1000 * 3 * 0.01 = 30
    // Total = 80
    assert.strictEqual(newState.players[0].balance, 920)
    assert.strictEqual(newState.turnPhase, 'END')
  })

  test('Generic tax tile with a flat price', () => {
    const player = createMockPlayer({ balance: 1000 })
    const tile: Tile = { id: 0, name: 'Generic Tax', type: TileType.TAX, price: 150 }
    const state = createMockState(player, tile)

    const newState = handleTaxLanding(state)

    assert.strictEqual(newState.players[0].balance, 850)
    assert.strictEqual(newState.turnPhase, 'END')
    const log = newState.logs[0] as { params: Record<string, string | number> }
    assert.strictEqual(log.params.amount, 150)
  })

  test('Generic tax tile without price (defaults to 0)', () => {
    const player = createMockPlayer({ balance: 1000 })
    const tile: Tile = { id: 0, name: 'Generic Tax', type: TileType.TAX } // No price
    const state = createMockState(player, tile)

    const newState = handleTaxLanding(state)

    assert.strictEqual(newState.players[0].balance, 1000)
    assert.strictEqual(newState.turnPhase, 'END')
    const log = newState.logs[0] as { params: Record<string, string | number> }
    assert.strictEqual(log.params.amount, 0)
  })

  test('Tax payment bringing balance below 0', () => {
    const player = createMockPlayer({ balance: 20 })
    const tile: Tile = { id: 0, name: 'Generic Tax', type: TileType.TAX, price: 50 }
    const state = createMockState(player, tile)

    const newState = handleTaxLanding(state)

    assert.strictEqual(newState.players[0].balance, -30)
    assert.strictEqual(newState.players[0].debtTo, 'bank')
    assert.strictEqual(newState.turnPhase, 'ACTION')
  })

  test('Tax payment leaving balance exactly 0', () => {
    const player = createMockPlayer({ balance: 50 })
    const tile: Tile = { id: 0, name: 'Generic Tax', type: TileType.TAX, price: 50 }
    const state = createMockState(player, tile)

    const newState = handleTaxLanding(state)

    assert.strictEqual(newState.players[0].balance, 0)
    assert.strictEqual(newState.players[0].debtTo, undefined)
    assert.strictEqual(newState.turnPhase, 'END')
  })
})

describe('landingUtils', () => {
  const dummyPlayer: Player = {
    id: 'p1',
    name: 'Player 1',
    avatar: 'avatar1.png',
    position: 0,
    balance: 1500,
    properties: [1, 2, 3],
    isBankrupt: false,
    color: '#000000',
  }

  describe('calculateRent', () => {
    test('should return 0 for PROPERTY tile without rent array', () => {
      const tile: Tile = { id: 1, name: 'Prop', type: TileType.PROPERTY }
      const rent = calculateRent(tile, dummyPlayer, [])
      assert.strictEqual(rent, 0)
    })

    test('should return base rent (index 0) when houses is 0 or undefined', () => {
      const tile: Tile = {
        id: 1,
        name: 'Prop',
        type: TileType.PROPERTY,
        rent: [10, 50, 150, 450, 625, 750],
      }
      const rent = calculateRent(tile, dummyPlayer, [])
      assert.strictEqual(rent, 10)
    })

    test('should return correct rent for given number of houses', () => {
      const tile: Tile = {
        id: 1,
        name: 'Prop',
        type: TileType.PROPERTY,
        rent: [10, 50, 150, 450, 625, 750],
        houses: 2,
      }
      const rent = calculateRent(tile, dummyPlayer, [])
      assert.strictEqual(rent, 150)
    })

    test('should fallback to base rent if houses exceeds rent array bounds', () => {
      const tile: Tile = {
        id: 1,
        name: 'Prop',
        type: TileType.PROPERTY,
        rent: [10, 50],
        houses: 5,
      }
      const rent = calculateRent(tile, dummyPlayer, [])
      assert.strictEqual(rent, 10)
    })

    test('should scale rent exponentially for AIRPORT based on owner properties', () => {
      const tile: Tile = { id: 1, name: 'Airport 1', type: TileType.AIRPORT }
      const allTiles: Tile[] = [
        { id: 1, name: 'Airport 1', type: TileType.AIRPORT },
        { id: 2, name: 'Airport 2', type: TileType.AIRPORT },
        { id: 3, name: 'Airport 3', type: TileType.AIRPORT },
      ]
      // Owner holds properties 1, 2, and 3, all of which are airports
      const rent = calculateRent(tile, dummyPlayer, allTiles)
      // count = 3 -> 25 * Math.pow(2, 2) = 100
      assert.strictEqual(rent, 100)
    })

    test('should handle UTILITY scaling the same as AIRPORT', () => {
      const tile: Tile = { id: 1, name: 'Utility 1', type: TileType.UTILITY }
      const allTiles: Tile[] = [
        { id: 1, name: 'Utility 1', type: TileType.UTILITY },
        { id: 2, name: 'Utility 2', type: TileType.UTILITY },
        { id: 3, name: 'Not Utility', type: TileType.PROPERTY },
      ]
      // Owner holds properties 1, 2, and 3, only two are utilities
      const rent = calculateRent(tile, dummyPlayer, allTiles)
      // count = 2 -> 25 * Math.pow(2, 1) = 50
      assert.strictEqual(rent, 50)
    })

    test('should return 12.5 for AIRPORT/UTILITY if count is 0 (owner does not actually own any)', () => {
      const tile: Tile = { id: 4, name: 'Utility 1', type: TileType.UTILITY }
      const allTiles: Tile[] = [{ id: 4, name: 'Utility 1', type: TileType.UTILITY }]
      // Owner holds properties [1, 2, 3], not 4
      const rent = calculateRent(tile, dummyPlayer, allTiles)
      // count = 0 -> 25 * Math.pow(2, -1) = 12.5
      assert.strictEqual(rent, 12.5)
    })

    test('should return flat 25 for TAX or SPECIAL tiles', () => {
      const taxTile: Tile = { id: 1, name: 'Tax', type: TileType.TAX }
      const rent = calculateRent(taxTile, dummyPlayer, [])
      assert.strictEqual(rent, 25)

      const specialTile: Tile = { id: 2, name: 'Special', type: TileType.SPECIAL }
      const rent2 = calculateRent(specialTile, dummyPlayer, [])
      assert.strictEqual(rent2, 25)
    })
  })

  describe('handleTaxLanding', () => {
    const baseState: GameState = {
      players: [
        {
          id: 'p1',
          name: 'Player 1',
          avatar: '',
          position: 0,
          balance: 2000,
          properties: [1, 2],
          isBankrupt: false,
          color: 'red',
        },
      ],
      currentPlayerIndex: 0,
      tiles: [],
      status: 'PLAYING',
      turnPhase: 'MOVING',
      lastDice: [1, 1],
      logs: [],
      chatMessages: [],
      prison: {},
      activeEvent: null,
      trades: [],
    }

    test('should deduct fixed price for generic tax tile', () => {
      const state = {
        ...baseState,
        tiles: [{ id: 0, name: 'Luxury Tax', type: TileType.TAX, price: 100 }],
      }
      const newState = handleTaxLanding(state)
      assert.strictEqual(newState.players[0].balance, 1900)
      assert.strictEqual(newState.turnPhase, 'END')
      assert.strictEqual(newState.logs.length, 1)
    })

    test('should calculate Income Tax dynamically', () => {
      const state = {
        ...baseState,
        tiles: [{ id: 0, name: 'Income Tax', type: TileType.TAX }],
      }
      // Balance: 2000, properties.length: 2
      // Tax: 2000 * 0.025 + 2000 * 2 * 0.005 = 50 + 20 = 70
      const newState = handleTaxLanding(state)
      assert.strictEqual(newState.players[0].balance, 1930)
      assert.strictEqual(newState.turnPhase, 'END')
    })

    test('should calculate Super Tax dynamically', () => {
      const state = {
        ...baseState,
        tiles: [{ id: 0, name: 'Super Tax', type: TileType.TAX }],
      }
      // Balance: 2000, properties.length: 2
      // Tax: 2000 * 0.05 + 2000 * 2 * 0.01 = 100 + 40 = 140
      const newState = handleTaxLanding(state)
      assert.strictEqual(newState.players[0].balance, 1860)
      assert.strictEqual(newState.turnPhase, 'END')
    })

    test('should handle insufficient funds (debt to bank) and switch to ACTION phase', () => {
      const state = {
        ...baseState,
        players: [
          {
            ...baseState.players[0],
            balance: 50,
          },
        ],
        tiles: [{ id: 0, name: 'Luxury Tax', type: TileType.TAX, price: 100 }],
      }
      const newState = handleTaxLanding(state)
      assert.strictEqual(newState.players[0].balance, -50)
      assert.strictEqual(newState.players[0].debtTo, 'bank')
      assert.strictEqual(newState.turnPhase, 'ACTION')
    })

    test('should handle missing tile price correctly', () => {
      const state = {
        ...baseState,
        tiles: [{ id: 0, name: 'Generic Tax', type: TileType.TAX }], // missing price
      }
      const newState = handleTaxLanding(state)
      assert.strictEqual(newState.players[0].balance, 2000)
      assert.strictEqual(newState.turnPhase, 'END')
    })
  })

  describe('handlePropertyLanding', () => {
    const baseState: GameState = {
      players: [
        {
          id: 'p1',
          name: 'Player 1',
          avatar: '',
          position: 0,
          balance: 1000,
          properties: [],
          isBankrupt: false,
          color: 'red',
        },
        {
          id: 'p2',
          name: 'Player 2',
          avatar: '',
          position: 0,
          balance: 1000,
          properties: [0], // Owns tile 0
          isBankrupt: false,
          color: 'blue',
        },
      ],
      currentPlayerIndex: 0, // p1 is active
      tiles: [
        {
          id: 0,
          name: 'Some Prop',
          type: TileType.PROPERTY,
          rent: [100, 200],
        },
      ],
      status: 'PLAYING',
      turnPhase: 'MOVING',
      lastDice: [1, 1],
      logs: [],
      chatMessages: [],
      prison: {},
      activeEvent: null,
      trades: [],
    }

    test('should do nothing if property is unowned', () => {
      const state = {
        ...baseState,
        players: [
          baseState.players[0],
          { ...baseState.players[1], properties: [] }, // p2 no longer owns it
        ],
      }
      const newState = handlePropertyLanding(state)
      assert.strictEqual(newState, state) // Returns original state reference
    })

    test('should do nothing if player lands on their own property', () => {
      const state = {
        ...baseState,
        players: [
          { ...baseState.players[0], properties: [0] }, // p1 owns it
          baseState.players[1],
        ],
      }
      const newState = handlePropertyLanding(state)
      assert.strictEqual(newState, state)
    })

    test('should do nothing if the owner is bankrupt', () => {
      const state = {
        ...baseState,
        players: [
          baseState.players[0],
          { ...baseState.players[1], isBankrupt: true }, // p2 owns it but is bankrupt
        ],
      }
      const newState = handlePropertyLanding(state)
      assert.strictEqual(newState, state)
    })

    test('should pay rent to the owner and end turn if sufficient funds', () => {
      const state = { ...baseState } // p1 lands on p2's property (rent: 100)
      const newState = handlePropertyLanding(state)

      assert.strictEqual(newState.players[0].balance, 900) // p1 paid 100
      assert.strictEqual(newState.players[1].balance, 1100) // p2 received 100
      assert.strictEqual(newState.turnPhase, 'END')
      assert.strictEqual(newState.logs.length, 1)
    })

    test('should set debt and change phase to ACTION if insufficient funds', () => {
      const state = {
        ...baseState,
        players: [
          { ...baseState.players[0], balance: 50 }, // p1 only has 50
          baseState.players[1], // p2 balance is 1000
        ],
      }
      const newState = handlePropertyLanding(state)

      assert.strictEqual(newState.players[0].balance, -50) // 50 - 100
      assert.strictEqual(newState.players[0].debtTo, 'p2')
      assert.strictEqual(newState.turnPhase, 'ACTION')

      // p2 should only receive what p1 can pay immediately (50)
      assert.strictEqual(newState.players[1].balance, 1050)
    })

    test('should not change state if landing on unowned property', () => {
      const player = createMockPlayer({ id: 'p1', position: 1 })
      const tile = createMockTile({ id: 1, type: TileType.PROPERTY, rent: [50] })
      const state = createMockState([player], [createMockTile({ id: 0 }), tile])

      state.currentPlayerIndex = 0

      const newState = handlePropertyLanding(state)

      assert.strictEqual(newState, state) // Reference equality for unchanged state
    })

    test('should not change state if landing on own property', () => {
      const player = createMockPlayer({ id: 'p1', position: 1, properties: [1] })
      const tile = createMockTile({ id: 1, type: TileType.PROPERTY, rent: [50] })
      const state = createMockState([player], [createMockTile({ id: 0 }), tile])

      state.currentPlayerIndex = 0

      const newState = handlePropertyLanding(state)

      assert.strictEqual(newState, state)
    })

    test('should not change state if owner is bankrupt', () => {
      const player1 = createMockPlayer({ id: 'p1', position: 1 })
      const player2 = createMockPlayer({ id: 'p2', position: 0, properties: [1], isBankrupt: true })
      const tile = createMockTile({ id: 1, type: TileType.PROPERTY, rent: [50] })
      const state = createMockState([player1, player2], [createMockTile({ id: 0 }), tile])

      state.currentPlayerIndex = 0

      const newState = handlePropertyLanding(state)

      assert.strictEqual(newState, state)
    })

    test('should deduct rent from player and add to owner if player has enough balance', () => {
      const player1 = createMockPlayer({ id: 'p1', position: 1, balance: 200 })
      const player2 = createMockPlayer({ id: 'p2', position: 0, balance: 500, properties: [1] })
      const tile = createMockTile({ id: 1, type: TileType.PROPERTY, rent: [50] })
      const state = createMockState([player1, player2], [createMockTile({ id: 0 }), tile])

      state.currentPlayerIndex = 0

      const newState = handlePropertyLanding(state)

      assert.notStrictEqual(newState, state)
      assert.strictEqual(newState.players[0].balance, 150) // 200 - 50
      assert.strictEqual(newState.players[1].balance, 550) // 500 + 50
      assert.strictEqual(newState.turnPhase, 'END')
      assert.strictEqual(newState.logs.length, 1)

      const log = newState.logs[0]
      assert.ok(typeof log === 'object' && log !== null)
      assert.strictEqual((log as any).key, 'paidRent')
      assert.strictEqual((log as any).params.amount, 50)
    })

    test('should handle debt correctly if player does not have enough balance', () => {
      const player1 = createMockPlayer({ id: 'p1', position: 1, balance: 30 }) // Cannot afford 50 rent
      const player2 = createMockPlayer({ id: 'p2', position: 0, balance: 500, properties: [1] })
      const tile = createMockTile({ id: 1, type: TileType.PROPERTY, rent: [50] })
      const state = createMockState([player1, player2], [createMockTile({ id: 0 }), tile])

      state.currentPlayerIndex = 0

      const newState = handlePropertyLanding(state)

      assert.notStrictEqual(newState, state)

      const newPlayer1 = newState.players[0]
      const newPlayer2 = newState.players[1]

      assert.strictEqual(newPlayer1.balance, -20) // 30 - 50 = -20
      assert.strictEqual(newPlayer1.debtTo, 'p2')

      // Owner gets what the player can afford immediately (50 rent + (-20) short = 30)
      assert.strictEqual(newPlayer2.balance, 530) // 500 + 30

      assert.strictEqual(newState.turnPhase, 'ACTION') // Must sell properties or bankrupt
      assert.strictEqual(newState.logs.length, 1)

      const log = newState.logs[0]
      assert.ok(typeof log === 'object' && log !== null)
      assert.strictEqual((log as any).key, 'paidRent')
      assert.strictEqual((log as any).params.amount, 50)
    })

    test('should handle negative initial balance correctly (player already in debt)', () => {
      const player1 = createMockPlayer({ id: 'p1', position: 1, balance: -10 }) // Already in debt
      const player2 = createMockPlayer({ id: 'p2', position: 0, balance: 500, properties: [1] })
      const tile = createMockTile({ id: 1, type: TileType.PROPERTY, rent: [50] })
      const state = createMockState([player1, player2], [createMockTile({ id: 0 }), tile])

      state.currentPlayerIndex = 0

      const newState = handlePropertyLanding(state)

      assert.notStrictEqual(newState, state)

      const newPlayer1 = newState.players[0]
      const newPlayer2 = newState.players[1]

      assert.strictEqual(newPlayer1.balance, -60) // -10 - 50 = -60
      assert.strictEqual(newPlayer1.debtTo, 'p2')

      // TODO: There is a bug in the implementation of amountPaidImmediately when the player
      // is already in debt before landing on the property. `newBalance` will be heavily negative
      // causing `rent + newBalance` to be negative, meaning the owner LOSES money.
      // Testing the current buggy behavior for now to document it.
      assert.strictEqual(newPlayer2.balance, 490) // 500 + (-10) = 490
    })
  })

  describe('handlePrisonLanding', () => {
    const baseState: GameState = {
      players: [
        {
          id: 'p1',
          name: 'Player 1',
          avatar: '',
          position: 30, // Go to prison tile
          balance: 1000,
          properties: [],
          isBankrupt: false,
          color: 'red',
        },
      ],
      currentPlayerIndex: 0,
      tiles: [], // Setup dynamically
      status: 'PLAYING',
      turnPhase: 'MOVING',
      lastDice: [1, 1],
      logs: [],
      chatMessages: [],
      prison: {},
      activeEvent: null,
      trades: [],
    }

    test('should move player to Prison and set turnsLeft to 2', () => {
      const state = {
        ...baseState,
        tiles: [
          ...Array(10).fill({ id: 0, name: 'Other', type: TileType.PROPERTY }),
          { id: 10, name: 'Prison', type: TileType.SPECIAL },
          ...Array(20).fill({ id: 0, name: 'Other', type: TileType.PROPERTY }),
        ],
      }
      const newState = handlePrisonLanding(state)

      assert.strictEqual(newState.players[0].position, 10)
      assert.strictEqual(newState.prison['p1'].turnsLeft, 2)
      assert.strictEqual(newState.turnPhase, 'END')
      assert.strictEqual(newState.logs.length, 1)
      assert.ok((newState.logs[0] as string).includes('was sent to Prison!'))
    })

    test('should fallback to position 10 if Prison tile is not found', () => {
      const state = {
        ...baseState,
        tiles: [], // No tiles, so findIndex returns -1
      }
      const newState = handlePrisonLanding(state)

      // The logic has a fallback: `prisonIndex !== -1 ? prisonIndex : 10`
      assert.strictEqual(newState.players[0].position, 10)
      assert.strictEqual(newState.prison['p1'].turnsLeft, 2)
      assert.strictEqual(newState.turnPhase, 'END')
    })
  })
})
