import type { Player, GameState, Tile } from '../types/game.ts'

export const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1',
  name: 'Player 1',
  position: 0,
  balance: 1500,
  properties: [],
  avatar: 'merchant',
  isBankrupt: false,
  color: 'red',
  hasJoinedVoice: false,
  ...overrides,
})

export const createMockTile = (overrides: Partial<Tile> = {}): Tile => ({
  id: 1,
  name: 'Property 1',
  type: 'PROPERTY',
  price: 100,
  housePrice: 50,
  rent: [10, 50, 150],
  ...overrides,
})

export const createMockState = (
  players: Player[] = [createMockPlayer()],
  tiles: Tile[] = [createMockTile({ id: 0, price: 0 })],
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
  activeEvent: overrides.activeEvent || null,
  ...overrides,
})
