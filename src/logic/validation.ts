import { TileType, type GameAction, type TradeOffer, type GameState } from '../types/game.ts'

export const isValidTradeOffer = (offer: unknown): offer is TradeOffer => {
  if (!offer || typeof offer !== 'object') return false
  const o = offer as Record<string, unknown>

  if (typeof o.myCash !== 'number' || o.myCash < 0 || !Number.isFinite(o.myCash)) return false
  if (typeof o.partnerCash !== 'number' || o.partnerCash < 0 || !Number.isFinite(o.partnerCash))
    return false
  if (
    !Array.isArray(o.myProperties) ||
    !o.myProperties.every((id: unknown) => typeof id === 'number' && Number.isInteger(id))
  )
    return false
  if (
    !Array.isArray(o.partnerProperties) ||
    !o.partnerProperties.every((id: unknown) => typeof id === 'number' && Number.isInteger(id))
  )
    return false
  return true
}

export const isValidGameState = (state: unknown): state is GameState => {
  if (!state || typeof state !== 'object') return false
  const s = state as Record<string, unknown>

  if (!Array.isArray(s.players)) return false
  for (const p of s.players) {
    if (!p || typeof p !== 'object') return false
    const player = p as Record<string, unknown>
    if (typeof player.id !== 'string') return false
    if (typeof player.name !== 'string') return false
    if (typeof player.position !== 'number') return false
    if (typeof player.balance !== 'number') return false
    if (!Array.isArray(player.properties)) return false
    if (typeof player.isBankrupt !== 'boolean') return false
    if (typeof player.color !== 'string') return false
  }

  if (typeof s.currentPlayerIndex !== 'number') return false
  if (!Array.isArray(s.tiles)) return false
  for (const t of s.tiles) {
    if (!t || typeof t !== 'object') return false
    const tile = t as Record<string, unknown>
    if (!Object.values(TileType).includes(tile.type as TileType)) return false
  }
  if (!['LOBBY', 'PLAYING', 'FINISHED', 'WAITING'].includes(s.status as string)) return false
  if (!['ROLL', 'ROLLING', 'MOVING', 'ACTION', 'END'].includes(s.turnPhase as string)) return false

  if (!Array.isArray(s.lastDice) || s.lastDice.length !== 2) return false
  if (typeof s.lastDice[0] !== 'number' || typeof s.lastDice[1] !== 'number') return false

  if (!Array.isArray(s.logs)) return false
  if (!Array.isArray(s.chatMessages)) return false

  if (typeof s.prison !== 'object' || s.prison === null) return false
  if (!Array.isArray(s.trades)) return false

  return true
}

export const isValidGameAction = (action: unknown): action is GameAction => {
  if (!action || typeof action !== 'object') return false
  const a = action as Record<string, unknown>

  if (typeof a.type !== 'string') return false

  switch (a.type) {
    case 'ROLL':
    case 'FINISH_ROLL':
    case 'MOVE_STEP':
    case 'BUY':
    case 'END_TURN':
    case 'START_COUNTDOWN':
    case 'TICK_COUNTDOWN':
    case 'CANCEL_COUNTDOWN':
    case 'PLAYER_DISCONNECT':
    case 'BANKRUPT':
    case 'REMATCH':
    case 'CLEAR_EVENT':
    case 'JOIN_VOICE':
    case 'ADD_BOT':
    case 'TICK_TURN_TIMER':
    case 'RESET_TURN_TIMER':
      return true
    case 'BUY_HOUSE':
    case 'SELL_HOUSE':
    case 'SELL_PROPERTY':
      return typeof a.tileId === 'number' && Number.isInteger(a.tileId)
    case 'CHAT':
      return typeof a.message === 'string'
    case 'PROPOSE_TRADE':
      return typeof a.partnerId === 'string' && isValidTradeOffer(a.offer)
    case 'ACCEPT_TRADE':
    case 'REJECT_TRADE':
    case 'CANCEL_TRADE':
      return typeof a.tradeId === 'string'
    case 'JOIN':
      return typeof a.name === 'string' && typeof a.avatar === 'string'
    case 'KICK_PLAYER':
      return typeof a.playerId === 'string'
    case 'LOAD_GAME':
      return isValidGameState(a.state)
    case 'TOGGLE_MUTE':
      return typeof a.isMuted === 'boolean'
    default:
      return false
  }
}
