export type TileType = 'PROPERTY' | 'AIRPORT' | 'UTILITY' | 'TAX' | 'EVENT' | 'SPECIAL'

export interface Tile {
  id: number
  name: string
  type: TileType
  group?: string // For properties
  price?: number
  rent?: number[] // [base, 1h, 2h, 3h, 4h, hotel]
  housePrice?: number
  color?: string
}

export interface Player {
  id: string
  name: string
  position: number
  balance: number
  properties: number[] // IDs of tiles
  isBankrupt: boolean
  color: string
}

export interface ChatMessage {
  sender: string
  message: string
}

export interface GameState {
  players: Player[]
  currentPlayerIndex: number
  tiles: Tile[]
  status: 'LOBBY' | 'PLAYING' | 'FINISHED' | 'WAITING'
  turnPhase: 'ROLL' | 'ROLLING' | 'MOVING' | 'ACTION' | 'END'
  lastDice: [number, number]
  stepsLeft?: number
  logs: string[]
  countdown?: number | null
  chatMessages: ChatMessage[]
}

export interface TradeOffer {
  myCash: number
  partnerCash: number
  myProperties: number[]
  partnerProperties: number[]
}

export type GameAction =
  | { type: 'ROLL' }
  | { type: 'FINISH_ROLL' }
  | { type: 'MOVE_STEP' }
  | { type: 'BUY' }
  | { type: 'END_TURN' }
  | { type: 'CHAT'; message: string }
  | { type: 'PROPOSE_TRADE'; partnerId: string; offer: TradeOffer }
  | { type: 'JOIN'; name?: string }
  | { type: 'START_COUNTDOWN' }
  | { type: 'TICK_COUNTDOWN' }
  | { type: 'CANCEL_COUNTDOWN' }
  | { type: 'PLAYER_DISCONNECT' }
