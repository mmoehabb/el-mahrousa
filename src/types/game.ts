export const TileType = {
  PROPERTY: 'PROPERTY',
  AIRPORT: 'AIRPORT',
  UTILITY: 'UTILITY',
  TAX: 'TAX',
  EVENT: 'EVENT',
  SPECIAL: 'SPECIAL',
} as const

export type TileType = (typeof TileType)[keyof typeof TileType]

export interface Tile {
  id: number
  name: string
  type: TileType
  group?: string // For properties
  price?: number
  rent?: number[] // [base, 1h, 2h, 3h, 4h, hotel]
  housePrice?: number
  color?: string
  houses?: number // Number of houses on the property (0-5)
}

export interface Player {
  id: PlayerId
  name: string
  avatar: string
  position: number
  balance: number
  properties: number[] // IDs of tiles
  isBankrupt: boolean
  color: string
  isMuted?: boolean
  isSpeaking?: boolean
  hasJoinedVoice?: boolean
  isBot?: boolean
  isDisconnected?: boolean
  debtTo?: string // ID of the player they owe money to, or 'bank'
}

export interface ChatMessage {
  sender: string
  message: string
}

export type GameLog = string | { key: string; params: Record<string, string | number> }

export type PlayerId = string

export interface PrisonRecord {
  turnsLeft: number
}

export type Prison = Record<PlayerId, PrisonRecord>

export type TradeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface TradeOffer {
  id?: string // will be generated when added to state
  fromId?: string
  toId?: string
  status?: TradeStatus
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
  | { type: 'BUY_HOUSE'; tileId: number }
  | { type: 'SELL_HOUSE'; tileId: number }
  | { type: 'SELL_PROPERTY'; tileId: number }
  | { type: 'END_TURN' }
  | { type: 'CHAT'; message: string }
  | { type: 'PROPOSE_TRADE'; partnerId: string; offer: TradeOffer }
  | { type: 'ACCEPT_TRADE'; tradeId: string }
  | { type: 'REJECT_TRADE'; tradeId: string }
  | { type: 'CANCEL_TRADE'; tradeId: string }
  | { type: 'JOIN'; name: string; avatar: string }
  | { type: 'START_COUNTDOWN' }
  | { type: 'TICK_COUNTDOWN' }
  | { type: 'CANCEL_COUNTDOWN' }
  | { type: 'PLAYER_DISCONNECT' }
  | { type: 'BANKRUPT' }
  | { type: 'REMATCH' }
  | { type: 'CLEAR_EVENT' }
  | { type: 'KICK_PLAYER'; playerId: string }
  | { type: 'TOGGLE_MUTE'; isMuted: boolean }
  | { type: 'JOIN_VOICE' }
  | { type: 'ADD_BOT' }
  | { type: 'LOAD_GAME'; state: GameState }
  | { type: 'TICK_TURN_TIMER' }
  | { type: 'RESET_TURN_TIMER' }

export interface ActiveEvent {
  title: string
  description: string
  type: 'gain' | 'loss' | 'move' | 'jail'
  playerName: string
  playerId: string
}

export interface GameState {
  players: Player[]
  currentPlayerIndex: number
  tiles: Tile[]
  status: 'LOBBY' | 'PLAYING' | 'FINISHED' | 'WAITING'
  turnPhase: 'ROLL' | 'ROLLING' | 'MOVING' | 'ACTION' | 'END'
  lastDice: [number, number]
  stepsLeft?: number
  logs: GameLog[]
  countdown?: number | null
  turnTimer?: number
  chatMessages: ChatMessage[]
  prison: Prison
  activeEvent: ActiveEvent | null
  trades: TradeOffer[]
  lastLoadedAt?: number
}
