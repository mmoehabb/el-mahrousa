import { describe, test } from 'node:test'
import assert from 'node:assert'
import {
  calculateRent,
  handleTaxLanding,
  handlePropertyLanding,
  handlePrisonLanding,
} from './landingUtils.ts'
import { TileType, type Tile, type Player, type GameState } from '../../types/game.ts'

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
