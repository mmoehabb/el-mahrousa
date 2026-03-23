import type { GameAction, TradeOffer } from '../types/game'

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
    case 'TOGGLE_MUTE':
      return typeof a.isMuted === 'boolean'
    default:
      return false
  }
}
