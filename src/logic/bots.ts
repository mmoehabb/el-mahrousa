import type { GameState, GameAction, Player } from '../types/game.ts'

// Module-level state to track bot trades (recently rejected trades, trades per turn, etc.)
const botMemory: Record<
  string,
  {
    tradesThisTurn: number
    lastTurnIndex: number
    rejectedOffers: { toId: string; propertyId: number }[]
  }
> = {}

/**
 * Helper to initialize or retrieve bot memory
 */
const getBotMemory = (botId: string, currentTurnIndex: number) => {
  if (!botMemory[botId] || botMemory[botId].lastTurnIndex !== currentTurnIndex) {
    // Reset if it's a new turn for this bot
    botMemory[botId] = {
      tradesThisTurn: 0,
      lastTurnIndex: currentTurnIndex,
      // Keep rejected offers across turns, or just for recent history?
      // Let's reset rejected offers each turn to keep it simple,
      // or keep them so it doesn't spam the same player across multiple turns.
      // We'll keep them across turns but reset if the bot needs a property again.
      rejectedOffers: botMemory[botId]?.rejectedOffers || [],
    }
  }
  return botMemory[botId]
}

/**
 * Check if acquiring a specific property completes a color group for a player
 */
const completesColorGroup = (gameState: GameState, playerId: string, tileId: number): boolean => {
  const tile = gameState.tiles[tileId]
  if (!tile.group) return false
  const groupTiles = gameState.tiles.filter((t) => t.group === tile.group)
  const playerProps = gameState.players.find((p) => p.id === playerId)?.properties || []

  // They complete the group if they own all other tiles in the group
  return groupTiles.every((t) => t.id === tileId || playerProps.includes(t.id))
}

/**
 * Check if losing a specific property breaks a complete color group for a player
 */
const breaksColorGroup = (gameState: GameState, playerId: string, tileId: number): boolean => {
  const tile = gameState.tiles[tileId]
  if (!tile.group) return false
  const groupTiles = gameState.tiles.filter((t) => t.group === tile.group)
  const playerProps = gameState.players.find((p) => p.id === playerId)?.properties || []

  // They break the group if they currently own all tiles in the group
  return groupTiles.every((t) => playerProps.includes(t.id))
}

/**
 * Evaluates the current game state for the active bot player and returns the next action to perform.
 * If no action is needed or possible, it returns null.
 */
export const getBotAction = (gameState: GameState): GameAction | null => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  if (!currentPlayer || !currentPlayer.isBot || gameState.status !== 'PLAYING') {
    return null
  }

  const memory = getBotMemory(currentPlayer.id, gameState.currentPlayerIndex)

  // Handle pending trades where the bot is the recipient
  const pendingTrade = gameState.trades.find(
    (t) => t.toId === currentPlayer.id && t.status === 'PENDING',
  )
  if (pendingTrade) {
    // Evaluate if the trade is beneficial
    // The bot is the recipient (partner) of the trade offer.
    // The offer creator ('my') is giving myCash and myProperties to the bot.
    // The bot ('partner') is giving partnerCash and partnerProperties to the creator.

    // Check if the trade completes a color group for the bot
    let completesGroupForBot = false
    for (const propId of pendingTrade.myProperties) {
      if (completesColorGroup(gameState, currentPlayer.id, propId)) {
        completesGroupForBot = true
      }
    }

    // Determine if the cash offered is "attractive"
    let isAttractiveCash = false
    if (currentPlayer.balance >= 1000) {
      isAttractiveCash = pendingTrade.myCash >= currentPlayer.balance * 2
    } else if (currentPlayer.balance >= 200) {
      isAttractiveCash = pendingTrade.myCash >= currentPlayer.balance * 3
    } else {
      isAttractiveCash = pendingTrade.myCash >= 700
    }

    // 1. DANGER: Does it give the other player a town that completes a color group?
    let isDangerTrade = false
    for (const propId of pendingTrade.partnerProperties) {
      // properties the bot is giving away
      if (completesColorGroup(gameState, pendingTrade.fromId!, propId)) {
        isDangerTrade = true
        break
      }
    }

    if (isDangerTrade) {
      if (completesGroupForBot || isAttractiveCash) {
        // Accept the danger trade if conditions are met
        return { type: 'ACCEPT_TRADE', tradeId: pendingTrade.id! }
      } else {
        return { type: 'REJECT_TRADE', tradeId: pendingTrade.id! }
      }
    }

    // 2. NAIVE: Does it make the bot lose a complete color group?
    for (const propId of pendingTrade.partnerProperties) {
      if (breaksColorGroup(gameState, currentPlayer.id, propId)) {
        return { type: 'REJECT_TRADE', tradeId: pendingTrade.id! }
      }
    }

    // Calculate net value
    const botGetsValue =
      pendingTrade.myCash +
      pendingTrade.myProperties.reduce((acc, id) => acc + (gameState.tiles[id].price || 0), 0)

    const botGivesValue =
      pendingTrade.partnerCash +
      pendingTrade.partnerProperties.reduce((acc, id) => acc + (gameState.tiles[id].price || 0), 0)

    if (completesGroupForBot || botGetsValue > botGivesValue) {
      return { type: 'ACCEPT_TRADE', tradeId: pendingTrade.id! }
    } else {
      return { type: 'REJECT_TRADE', tradeId: pendingTrade.id! }
    }
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
      // If balance is negative, we MUST sell, trade, or bankrupt
      if (currentPlayer.balance < 0) {
        // We must check if there is an active trade involving this bot already to avoid spamming
        const activeTrade = gameState.trades.find(
          (t) => t.fromId === currentPlayer.id && t.status === 'PENDING',
        )
        if (activeTrade) return null // Wait for the trade to be accepted or rejected

        // First try to sell properties to other players before the bank
        const sellableProperties = getSellableProperties(gameState, currentPlayer)
        if (sellableProperties.length > 0) {
          for (const propId of sellableProperties) {
            // Find players who might want it (e.g., they own other properties in the group)
            const tile = gameState.tiles[propId]
            const potentialBuyers = gameState.players.filter((p) => {
              if (p.id === currentPlayer.id || p.isBot) return false
              return p.properties.some((pid) => gameState.tiles[pid].group === tile.group)
            })

            for (const buyer of potentialBuyers) {
              // Check if we already tried this
              if (
                memory.rejectedOffers.some((ro) => ro.toId === buyer.id && ro.propertyId === propId)
              ) {
                continue
              }

              // Ask for enough cash to clear debt + 100
              const askingPrice = Math.abs(currentPlayer.balance) + 100
              if (buyer.balance >= askingPrice) {
                memory.rejectedOffers.push({ toId: buyer.id, propertyId: propId })
                return {
                  type: 'PROPOSE_TRADE',
                  partnerId: buyer.id,
                  offer: {
                    myCash: 0,
                    partnerCash: askingPrice,
                    myProperties: [propId],
                    partnerProperties: [],
                  },
                }
              }
            }
          }
        }

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

      // Pre-compute owned properties to avoid O(N) lookup
      const ownedProperties = new Set<number>()
      for (const p of gameState.players) {
        for (const propId of p.properties) {
          ownedProperties.add(propId)
        }
      }

      if (isPropertyUnowned(ownedProperties, currentTile.id) && currentTile.price) {
        // Simple heuristic: buy if we have enough money, leaving a buffer of 200 EGP
        if (currentPlayer.balance >= currentTile.price + 200) {
          return { type: 'BUY' }
        }
      }

      // If nothing else to do, consider proposing trades for needed properties
      if (memory.tradesThisTurn < 3) {
        const activeTrade = gameState.trades.find(
          (t) => t.fromId === currentPlayer.id && t.status === 'PENDING',
        )
        if (!activeTrade) {
          // Don't propose if one is pending
          // Find properties we need to complete a town
          const neededProperties = getNeededProperties(gameState, currentPlayer)
          for (const { tileId, ownerId } of neededProperties) {
            if (
              memory.rejectedOffers.some((ro) => ro.toId === ownerId && ro.propertyId === tileId)
            ) {
              continue
            }

            const tile = gameState.tiles[tileId]
            const owner = gameState.players.find((p) => p.id === ownerId)
            if (!owner || !tile.price) continue

            // Determine if we can make a very attractive offer (2x base price + half bot balance)
            const veryAttractiveOffer = tile.price * 2 + Math.floor(currentPlayer.balance / 2)
            const attractiveOffer = tile.price * 2

            let offerAmount = 0
            if (currentPlayer.balance >= veryAttractiveOffer) {
              offerAmount = veryAttractiveOffer
            } else if (currentPlayer.balance >= attractiveOffer) {
              offerAmount = attractiveOffer
            }

            if (offerAmount > 0) {
              memory.tradesThisTurn++
              memory.rejectedOffers.push({ toId: ownerId, propertyId: tileId })

              return {
                type: 'PROPOSE_TRADE',
                partnerId: ownerId,
                offer: {
                  myCash: offerAmount,
                  partnerCash: 0,
                  myProperties: [],
                  partnerProperties: [tileId],
                },
              }
            }
          }
        } else {
          // We have a pending trade, wait for it
          return null
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
const isPropertyUnowned = (ownedProperties: Set<number>, tileId: number): boolean => {
  return !ownedProperties.has(tileId)
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
  const sellableProperties = getSellableProperties(gameState, player)

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

const getSellableProperties = (gameState: GameState, player: Player): number[] => {
  return player.properties.filter((tileId) => {
    const tile = gameState.tiles[tileId]
    return (tile.houses || 0) === 0
  })
}

// Helper: Get properties needed to complete a color group
const getNeededProperties = (
  gameState: GameState,
  player: Player,
): { tileId: number; ownerId: string }[] => {
  const needed: { tileId: number; ownerId: string }[] = []

  // Iterate over properties we own
  for (const propId of player.properties) {
    const tile = gameState.tiles[propId]
    if (!tile.group) continue

    const groupTiles = gameState.tiles.filter((t) => t.group === tile.group)
    const missingTiles = groupTiles.filter((t) => !player.properties.includes(t.id))

    // If we only need 1 or 2 tiles to complete the town
    if (missingTiles.length > 0 && missingTiles.length <= 2) {
      for (const missing of missingTiles) {
        // Find owner
        const owner = gameState.players.find((p) => p.properties.includes(missing.id))
        // If owned by someone else (not the bank) and they are not a bot
        if (owner && owner.id !== player.id) {
          // Avoid duplicate requests for the same tile
          if (!needed.some((n) => n.tileId === missing.id)) {
            needed.push({ tileId: missing.id, ownerId: owner.id })
          }
        }
      }
    }
  }

  return needed
}
