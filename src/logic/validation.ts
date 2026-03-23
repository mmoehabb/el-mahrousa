import type { GameAction, TradeOffer } from '../types/game'

export const isValidTradeOffer = (offer: any): offer is TradeOffer => {
  if (!offer || typeof offer !== 'object') return false
  if (typeof offer.myCash !== 'number' || offer.myCash < 0 || !Number.isFinite(offer.myCash))
    return false
  if (
    typeof offer.partnerCash !== 'number' ||
    offer.partnerCash < 0 ||
    !Number.isFinite(offer.partnerCash)
  )
    return false
  if (
    !Array.isArray(offer.myProperties) ||
    !offer.myProperties.every((id: any) => typeof id === 'number' && Number.isInteger(id))
  )
    return false
  if (
    !Array.isArray(offer.partnerProperties) ||
    !offer.partnerProperties.every((id: any) => typeof id === 'number' && Number.isInteger(id))
  )
    return false
  return true
}

export const isValidGameAction = (action: any): action is GameAction => {
  if (!action || typeof action !== 'object' || typeof action.type !== 'string') return false

  switch (action.type) {
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
      return typeof action.tileId === 'number' && Number.isInteger(action.tileId)
    case 'CHAT':
      return typeof action.message === 'string'
    case 'PROPOSE_TRADE':
      return typeof action.partnerId === 'string' && isValidTradeOffer(action.offer)
    case 'ACCEPT_TRADE':
    case 'REJECT_TRADE':
    case 'CANCEL_TRADE':
      return typeof action.tradeId === 'string'
    case 'JOIN':
      return typeof action.name === 'string' && typeof action.avatar === 'string'
    case 'KICK_PLAYER':
      return typeof action.playerId === 'string'
    case 'TOGGLE_MUTE':
      return typeof action.isMuted === 'boolean'
    default:
      return false
  }
}
