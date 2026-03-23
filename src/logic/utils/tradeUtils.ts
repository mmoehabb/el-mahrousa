import type { Player, TradeOffer } from '../../types/game.ts'

export const validateTrade = (
  p1: Player | undefined,
  p2: Player | undefined,
  trade: TradeOffer,
): { valid: boolean; error?: string } => {
  if (!p1 || !p2) {
    return { valid: false, error: 'Trade failed: One or both players not found.' }
  }

  // Validate cash
  if (p1.balance < trade.myCash || p2.balance < trade.partnerCash) {
    return { valid: false, error: 'Trade failed: Insufficient funds.' }
  }

  // Validate properties
  const p1OwnsAll = trade.myProperties.every((id) => p1.properties.includes(id))
  const p2OwnsAll = trade.partnerProperties.every((id) => p2.properties.includes(id))

  if (!p1OwnsAll || !p2OwnsAll) {
    return { valid: false, error: 'Trade failed: Properties not owned.' }
  }

  return { valid: true }
}

export const applyTradeToPlayers = (players: Player[], trade: TradeOffer): Player[] => {
  return players.map((p) => {
    if (p.id === trade.fromId) {
      return {
        ...p,
        balance: p.balance - trade.myCash + trade.partnerCash,
        properties: p.properties
          .filter((id: number) => !trade.myProperties.includes(id))
          .concat(trade.partnerProperties),
      }
    }
    if (p.id === trade.toId) {
      return {
        ...p,
        balance: p.balance - trade.partnerCash + trade.myCash,
        properties: p.properties
          .filter((id: number) => !trade.partnerProperties.includes(id))
          .concat(trade.myProperties),
      }
    }
    return p
  })
}
