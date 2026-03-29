import { test, describe } from 'node:test'
import assert from 'node:assert'
import { handleTaxLanding } from './landingUtils.ts'
import { TileType, type GameState, type Player, type Tile } from '../../types/game.ts'

const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'player1',
  name: 'Player 1',
  avatar: 'avatar1',
  position: 0,
  balance: 1000,
  properties: [],
  isBankrupt: false,
  color: '#000000',
  ...overrides,
})

const createMockState = (player: Player, tile: Tile): GameState => ({
  players: [player],
  currentPlayerIndex: 0,
  tiles: [tile],
  status: 'PLAYING',
  turnPhase: 'ROLLING',
  lastDice: [1, 1],
  logs: [],
  chatMessages: [],
  prison: {},
  activeEvent: null,
  trades: [],
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
    assert.strictEqual((newState.logs[0] as any).key, 'paidTax')
    assert.strictEqual((newState.logs[0] as any).params.amount, 25)
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
    assert.strictEqual((newState.logs[0] as any).params.amount, 150)
  })

  test('Generic tax tile without price (defaults to 0)', () => {
    const player = createMockPlayer({ balance: 1000 })
    const tile: Tile = { id: 0, name: 'Generic Tax', type: TileType.TAX } // No price
    const state = createMockState(player, tile)

    const newState = handleTaxLanding(state)

    assert.strictEqual(newState.players[0].balance, 1000)
    assert.strictEqual(newState.turnPhase, 'END')
    assert.strictEqual((newState.logs[0] as any).params.amount, 0)
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
