import type { GameState, GameAction, Player } from '../types/game.ts'

/**
 * Evaluates the current game state for the active bot player and returns the next action to perform.
 * If no action is needed or possible, it returns null.
 */
export const getBotAction = (gameState: GameState): GameAction | null => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  if (!currentPlayer || !currentPlayer.isBot || gameState.status !== 'PLAYING') {
    return null
  }

  // Handle pending trades where the bot is the recipient
  const pendingTrade = gameState.trades.find(
    (t) => t.toId === currentPlayer.id && t.status === 'PENDING',
  )
  if (pendingTrade) {
    // Basic logic: Reject all trades for now, or randomly accept
    // Let's implement a safe heuristic: if it gives the bot more cash and equal/more properties, accept, else reject.
    // Actually, simple is better: Reject all trades to prevent exploitation by human players.
    // We can evaluate if buying property is worth it later.
    return { type: 'REJECT_TRADE', tradeId: pendingTrade.id! }
  }

  // Handle Turn Phases
  switch (gameState.turnPhase) {
    case 'ROLL': {
      // Before rolling, check if we want to buy houses
      const houseToBuy = getHouseToBuy(gameState, currentPlayer)
      if (houseToBuy !== null) {
        return { type: 'BUY_HOUSE', tileId: houseToBuy }
      }
      return { type: 'ROLL' }
    }

    case 'ROLLING':
      return { type: 'FINISH_ROLL' }

    case 'MOVING':
      return { type: 'MOVE_STEP' }

    case 'ACTION': {
      // If balance is negative, we MUST sell or bankrupt
      if (currentPlayer.balance < 0) {
        // Try selling houses first
        const houseToSell = getHouseToSell(gameState, currentPlayer)
        if (houseToSell !== null) {
          return { type: 'SELL_HOUSE', tileId: houseToSell }
        }
        // Then try selling properties
        const propToSell = getPropertyToSell(gameState, currentPlayer)
        if (propToSell !== null) {
          return { type: 'SELL_PROPERTY', tileId: propToSell }
        }
        // If we can't sell anything and are still in debt
        return { type: 'BANKRUPT' }
      }

      // If we landed on an unowned property, consider buying it
      const currentTile = gameState.tiles[currentPlayer.position]
      if (isPropertyUnowned(gameState, currentTile.id) && currentTile.price) {
        // Simple heuristic: buy if we have enough money, leaving a buffer of 200 EGP
        if (currentPlayer.balance >= currentTile.price + 200) {
          return { type: 'BUY' }
        }
      }

      // If nothing else to do, end turn
      return { type: 'END_TURN' }
    }

    case 'END':
      return { type: 'END_TURN' }

    default:
      return null
  }
}

// Helper: Check if a property is unowned
const isPropertyUnowned = (gameState: GameState, tileId: number): boolean => {
  return !gameState.players.some((p) => p.properties.includes(tileId))
}

// Helper: Determine if the bot should buy a house on any property
const getHouseToBuy = (gameState: GameState, player: Player): number | null => {
  // Find properties where we own the whole group and can build
  const buildableTiles = player.properties.filter((tileId) => {
    const tile = gameState.tiles[tileId]
    if (!tile.group || !tile.housePrice || !tile.rent) return false

    // Check if we own all in the group
    const groupTiles = gameState.tiles.filter((t) => t.group === tile.group)
    const ownsAll = groupTiles.every((t) => player.properties.includes(t.id))
    if (!ownsAll) return false

    // Check if we haven't reached max houses
    const currentHouses = tile.houses || 0
    if (currentHouses >= tile.rent.length - 1) return false

    // Check if we can afford it (leaving a 300 EGP buffer)
    const cost = tile.housePrice * Math.pow(2, currentHouses)
    if (player.balance < cost + 300) return false

    return true
  })

  if (buildableTiles.length > 0) {
    // Pick the most expensive one we can afford to maximize rent, or just random
    // For simplicity, pick the first one
    return buildableTiles[0]
  }

  return null
}

// Helper: Determine which house to sell when in debt
const getHouseToSell = (gameState: GameState, player: Player): number | null => {
  const tilesWithHouses = player.properties.filter((tileId) => {
    const tile = gameState.tiles[tileId]
    return (tile.houses || 0) > 0
  })

  if (tilesWithHouses.length > 0) {
    // Sell a house from the cheapest property first
    tilesWithHouses.sort((a, b) => {
      const priceA = gameState.tiles[a].housePrice || 0
      const priceB = gameState.tiles[b].housePrice || 0
      return priceA - priceB
    })
    return tilesWithHouses[0]
  }

  return null
}

// Helper: Determine which property to sell when in debt
const getPropertyToSell = (gameState: GameState, player: Player): number | null => {
  // Find properties with 0 houses
  const sellableProperties = player.properties.filter((tileId) => {
    const tile = gameState.tiles[tileId]
    return (tile.houses || 0) === 0
  })

  if (sellableProperties.length > 0) {
    // Sort by price ascending to sell cheapest first
    sellableProperties.sort((a, b) => {
      const priceA = gameState.tiles[a].price || 0
      const priceB = gameState.tiles[b].price || 0
      return priceA - priceB
    })
    return sellableProperties[0]
  }

  return null
}
