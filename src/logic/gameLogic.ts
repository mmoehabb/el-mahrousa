import { TileType, type GameState, type TradeOffer } from '../types/game.ts'
import { GAME_CONFIG, HAZAK_EVENTS } from '../config/gameConfig.ts'
import { BOARD_DATA } from '../config/gameConfig.ts'
import { validateTrade, applyTradeToPlayers } from './utils/tradeUtils.ts'
import {
  handleTaxLanding,
  handlePropertyLanding,
  handlePrisonLanding,
} from './utils/landingUtils.ts'

export const processDebtRepayment = (prevState: GameState, newState: GameState): GameState => {
  let hasDebtRepaid = false
  const updatedPlayers = [...newState.players]

  for (let i = 0; i < updatedPlayers.length; i++) {
    const player = updatedPlayers[i]
    const prevPlayer = prevState.players.find((p) => p.id === player.id)

    // Check if the player gained balance and has a debt
    if (prevPlayer && player.balance > prevPlayer.balance && player.debtTo) {
      // Wait, let's keep it simple: the amount they owe is tracked implicitly by their negative balance.
      // But we need to know exactly how much of their debt was repaid in this step.
      // E.g., prevBalance = -400, newBalance = +100. Gained = 500. Debt repaid = 400.
      // E.g., prevBalance = -400, newBalance = -300. Gained = 100. Debt repaid = 100.
      // E.g., prevBalance = -400, newBalance = 0. Gained = 400. Debt repaid = 400.
      let debtRepaid = 0
      if (prevPlayer.balance < 0) {
        if (player.balance >= 0) {
          debtRepaid = -prevPlayer.balance // Paid off entirely
          updatedPlayers[i] = { ...player, debtTo: undefined }
        } else {
          debtRepaid = player.balance - prevPlayer.balance // Paid partially
        }
      }

      if (debtRepaid > 0 && player.debtTo !== 'bank') {
        const creditorIndex = updatedPlayers.findIndex((p) => p.id === player.debtTo)
        if (creditorIndex !== -1) {
          updatedPlayers[creditorIndex] = {
            ...updatedPlayers[creditorIndex],
            balance: updatedPlayers[creditorIndex].balance + debtRepaid,
          }
          hasDebtRepaid = true
        }
      } else if (debtRepaid > 0 && player.debtTo === 'bank') {
        hasDebtRepaid = true // Just so we return the updatedPlayers reference if debtTo was removed
      }

      // If we recovered fully, ensure the turn phase can move on if they are the current player
      if (
        player.balance >= 0 &&
        i === newState.currentPlayerIndex &&
        newState.turnPhase === 'ACTION'
      ) {
        // But only if we aren't doing another action that changes turn phase. Let's just update the player.
        // Actually, let's not auto-change the phase here, they can click End Turn.
      }
    }
  }

  if (hasDebtRepaid || updatedPlayers.some((p, i) => p.debtTo !== newState.players[i].debtTo)) {
    return { ...newState, players: updatedPlayers }
  }

  return newState
}

export const createInitialState = (): GameState => ({
  players: [],
  currentPlayerIndex: 0,
  tiles: BOARD_DATA,
  status: 'LOBBY',
  turnPhase: 'ROLL',
  lastDice: [1, 1],
  logs: ['started'],
  countdown: null,
  chatMessages: [],
  prison: {},
  activeEvent: null,
  trades: [],
})

// Generates a float between 0 (inclusive) and 1 (exclusive) using crypto
const secureRandom = (): number => {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0] / (0xffffffff + 1)
}

export const rollDice = (): [number, number] => {
  return [Math.floor(secureRandom() * 6) + 1, Math.floor(secureRandom() * 6) + 1]
}

export const moveOneStep = (state: GameState): GameState => {
  const player = state.players[state.currentPlayerIndex]
  const newPosition = (player.position + 1) % state.tiles.length

  const newState = { ...state }
  const newPlayers = [...state.players]

  // Passed GO
  if (newPosition < player.position) {
    newPlayers[state.currentPlayerIndex] = {
      ...player,
      position: newPosition,
      balance: player.balance + GAME_CONFIG.GO_REWARD,
    }
    newState.logs = [
      { key: 'passedStart', params: { name: player.name, amount: GAME_CONFIG.GO_REWARD } },
      ...newState.logs,
    ]
  } else {
    newPlayers[state.currentPlayerIndex] = {
      ...player,
      position: newPosition,
    }
  }

  newState.players = newPlayers
  return newState
}

export const applyEventLogic = (state: GameState): GameState => {
  const player = state.players[state.currentPlayerIndex]
  const tile = state.tiles[player.position]
  const newState = { ...state }

  if (tile.name === 'Hazak') {
    // Hazak Random Outcomes
    const events = HAZAK_EVENTS

    const event = events[Math.floor(secureRandom() * events.length)]
    const newPlayers = [...state.players]

    if (event.type === 'gain') {
      newPlayers[state.currentPlayerIndex] = { ...player, balance: player.balance + event.amount }
    } else if (event.type === 'loss') {
      newPlayers[state.currentPlayerIndex] = { ...player, balance: player.balance - event.amount }
    } else if (event.type === 'move') {
      // If moving passes start (and not just going backward to start), collect Go Reward
      if (event.target < player.position && event.target !== 0) {
        newPlayers[state.currentPlayerIndex] = {
          ...player,
          position: event.target,
          balance: player.balance + GAME_CONFIG.GO_REWARD,
        }
      } else if (event.target === 0) {
        newPlayers[state.currentPlayerIndex] = {
          ...player,
          position: event.target,
          balance: player.balance + GAME_CONFIG.GO_REWARD,
        }
      } else {
        newPlayers[state.currentPlayerIndex] = { ...player, position: event.target }
      }
    } else if (event.type === 'jail') {
      newPlayers[state.currentPlayerIndex] = { ...player, position: event.target }
      newState.prison = { ...newState.prison, [player.id]: { turnsLeft: 2 } }
    }

    newState.players = newPlayers
    newState.activeEvent = {
      title: event.title,
      description: event.description,
      type: event.type,
      playerName: player.name,
      playerId: player.id,
    }

    newState.logs = [
      { key: 'eventHazak', params: { name: player.name, title: event.title } },
      ...newState.logs,
    ]

    // Check if debt forces turn to stay ACTION
    if (newPlayers[state.currentPlayerIndex].balance >= 0) {
      newState.turnPhase = 'END'
    } else {
      newState.turnPhase = 'ACTION' // Must sell properties or bankrupt
    }
  } else if (tile.name === 'Sodfa') {
    // Sodfa Random Teleportation
    // Get all PROPERTY, AIRPORT, UTILITY tiles
    const properties = state.tiles.filter(
      (t) =>
        t.type === TileType.PROPERTY || t.type === TileType.AIRPORT || t.type === TileType.UTILITY,
    )
    const randomTile = properties[Math.floor(secureRandom() * properties.length)]
    const newPlayers = [...state.players]

    newPlayers[state.currentPlayerIndex] = { ...player, position: randomTile.id }

    newState.players = newPlayers
    newState.activeEvent = {
      title: 'Sodfa Teleport',
      description: `Sodfa! You have been teleported to ${randomTile.name}!`,
      type: 'move',
      playerName: player.name,
      playerId: player.id,
    }

    newState.logs = [
      { key: 'eventSodfa', params: { name: player.name, property: randomTile.name } },
      ...newState.logs,
    ]

    // Since they moved, we should apply landing logic for their new tile immediately,
    // but without clearing the event popup.
    // However, they can only land on PROPERTY, AIRPORT, UTILITY, so we can run a subset of logic or recurse safely.
    // For safety, let's just let them end their turn or pay rent here.
    const tempState = applyLandingLogic({ ...newState, turnPhase: 'ACTION' })
    tempState.activeEvent = newState.activeEvent // keep event
    return tempState
  }

  return newState
}

export const applyLandingLogic = (state: GameState): GameState => {
  const player = state.players[state.currentPlayerIndex]
  const tile = state.tiles[player.position]
  const newState = { ...state }

  if (tile.type === TileType.EVENT) {
    return applyEventLogic(newState)
  }

  if (tile.type === TileType.TAX) {
    return handleTaxLanding(newState)
  } else if (
    tile.type === TileType.PROPERTY ||
    tile.type === TileType.AIRPORT ||
    tile.type === TileType.UTILITY
  ) {
    return handlePropertyLanding(newState)
  } else if (tile.name.includes('Prison')) {
    return handlePrisonLanding(newState)
  }

  return newState
}

export const buyHouse = (state: GameState, tileId: number): GameState => {
  if (state.turnPhase !== 'ROLL' && state.turnPhase !== 'ACTION' && state.turnPhase !== 'END')
    return state
  const player = state.players[state.currentPlayerIndex]
  const tile = state.tiles[tileId]

  if (!player.properties.includes(tileId) || !tile.housePrice || !tile.rent) return state

  // Must own all properties in the same group
  if (tile.group) {
    const groupTiles = state.tiles.filter((t) => t.group === tile.group)
    const ownsAll = groupTiles.every((t) => player.properties.includes(t.id))
    if (!ownsAll) return state
  }

  const currentHouses = tile.houses || 0
  if (currentHouses >= tile.rent.length - 1) return state // Max houses reached

  const cost = tile.housePrice * Math.pow(2, currentHouses)
  if (player.balance < cost) return state

  const newPlayers = [...state.players]
  newPlayers[state.currentPlayerIndex] = {
    ...player,
    balance: player.balance - cost,
  }

  const newTiles = [...state.tiles]
  newTiles[tileId] = {
    ...tile,
    houses: currentHouses + 1,
  }

  return {
    ...state,
    players: newPlayers,
    tiles: newTiles,
    logs: [
      { key: 'boughtHouse', params: { name: player.name, property: tile.name, price: cost } },
      ...state.logs,
    ],
  }
}

export const sellHouse = (state: GameState, tileId: number): GameState => {
  if (state.turnPhase !== 'ROLL' && state.turnPhase !== 'ACTION' && state.turnPhase !== 'END')
    return state
  const player = state.players[state.currentPlayerIndex]
  const tile = state.tiles[tileId]

  if (!player.properties.includes(tileId) || !tile.housePrice) return state

  const currentHouses = tile.houses || 0
  if (currentHouses === 0) return state

  // Refund is half of what they paid for the current house level
  const refund = (tile.housePrice * Math.pow(2, currentHouses - 1)) / 2

  const newPlayers = [...state.players]
  newPlayers[state.currentPlayerIndex] = {
    ...player,
    balance: player.balance + refund,
  }

  const newTiles = [...state.tiles]
  newTiles[tileId] = {
    ...tile,
    houses: currentHouses - 1,
  }

  return {
    ...state,
    players: newPlayers,
    tiles: newTiles,
    logs: [
      { key: 'soldHouse', params: { name: player.name, property: tile.name, price: refund } },
      ...state.logs,
    ],
  }
}

export const sellProperty = (state: GameState, tileId: number): GameState => {
  if (state.turnPhase !== 'ROLL' && state.turnPhase !== 'ACTION' && state.turnPhase !== 'END')
    return state
  const player = state.players[state.currentPlayerIndex]
  const tile = state.tiles[tileId]

  if (!player.properties.includes(tileId) || !tile.price) return state

  const currentHouses = tile.houses || 0
  if (currentHouses > 0) return state // Must sell houses first

  const refund = tile.price / 2

  const newPlayers = [...state.players]
  newPlayers[state.currentPlayerIndex] = {
    ...player,
    balance: player.balance + refund,
    properties: player.properties.filter((id) => id !== tileId),
  }

  return {
    ...state,
    players: newPlayers,
    logs: [
      { key: 'soldProperty', params: { name: player.name, property: tile.name, price: refund } },
      ...state.logs,
    ],
  }
}

export const buyProperty = (state: GameState, tileId: number): GameState => {
  const player = state.players[state.currentPlayerIndex]
  const tile = state.tiles[tileId]

  const isOwned = state.players.some((p) => p.properties.includes(tileId))
  if (isOwned || !tile.price || player.balance < tile.price) return state

  const newPlayers = [...state.players]
  newPlayers[state.currentPlayerIndex] = {
    ...player,
    balance: player.balance - tile.price,
    properties: [...player.properties, tileId],
  }

  return {
    ...state,
    players: newPlayers,
    logs: [
      { key: 'bought', params: { name: player.name, property: tile.name, price: tile.price } },
      ...state.logs,
    ],
    turnPhase: 'END',
  }
}

export const endTurn = (state: GameState): GameState => {
  const currentPlayer = state.players[state.currentPlayerIndex]
  if (currentPlayer.balance < 0) {
    return state
  }

  let nextIndex = (state.currentPlayerIndex + 1) % state.players.length
  let attempts = 0

  const newState = { ...state, prison: { ...state.prison } }

  while (attempts < state.players.length) {
    const nextPlayer = state.players[nextIndex]

    if (nextPlayer.isBankrupt) {
      nextIndex = (nextIndex + 1) % state.players.length
      attempts++
      continue
    }

    const prisonRecord = newState.prison[nextPlayer.id]
    if (prisonRecord) {
      if (prisonRecord.turnsLeft > 0) {
        newState.prison[nextPlayer.id] = { turnsLeft: prisonRecord.turnsLeft - 1 }
        newState.logs = [
          `${nextPlayer.name} is in Prison for ${prisonRecord.turnsLeft - 1} more turn(s).`,
          ...newState.logs,
        ]
        nextIndex = (nextIndex + 1) % state.players.length
        attempts++
        continue
      } else {
        const newPrison = { ...newState.prison }
        delete newPrison[nextPlayer.id]
        newState.prison = newPrison
        newState.logs = [`${nextPlayer.name} has been released from Prison!`, ...newState.logs]
      }
    }

    break
  }

  const nextPlayerId = newState.players[nextIndex].id
  const isStillInPrison =
    newState.prison[nextPlayerId] && newState.prison[nextPlayerId].turnsLeft > 0

  return {
    ...newState,
    currentPlayerIndex: nextIndex,
    turnPhase: isStillInPrison ? 'END' : 'ROLL',
  }
}

export const handleBankrupt = (state: GameState, playerId: string): GameState => {
  const bankruptPlayer = state.players.find((p) => p.id === playerId)

  const newTiles = state.tiles.map((tile) => {
    if (bankruptPlayer && bankruptPlayer.properties.includes(tile.id) && tile.houses) {
      return { ...tile, houses: 0 }
    }
    return tile
  })

  const newPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return { ...p, isBankrupt: true, balance: 0, properties: [] }
    }
    return p
  })

  return { ...state, players: newPlayers, tiles: newTiles }
}

export const proposeTrade = (
  state: GameState,
  fromId: string,
  toId: string,
  offer: TradeOffer,
): GameState => {
  const newTrade: TradeOffer = {
    ...offer,
    id: crypto.randomUUID(),
    fromId,
    toId,
    status: 'PENDING',
  }
  return {
    ...state,
    trades: [newTrade, ...(state.trades || [])],
    logs: [`A new trade has been proposed.`, ...state.logs],
  }
}

export const acceptTrade = (state: GameState, tradeId: string): GameState => {
  const trade = state.trades.find((t) => t.id === tradeId)
  if (!trade || trade.status !== 'PENDING') {
    return {
      ...state,
      logs: [`Trade failed: Trade not found or not pending.`, ...state.logs],
    }
  }

  const p1 = state.players.find((p) => p.id === trade.fromId)
  const p2 = state.players.find((p) => p.id === trade.toId)

  const validation = validateTrade(p1, p2, trade)
  if (!validation.valid) {
    return {
      ...state,
      logs: [validation.error!, ...state.logs],
    }
  }

  const newPlayers = applyTradeToPlayers(state.players, trade)

  const newTrades = state.trades.map((t) =>
    t.id === tradeId ? { ...t, status: 'ACCEPTED' as const } : t,
  )

  return {
    ...state,
    players: newPlayers,
    trades: newTrades,
    logs: [`Trade executed between ${p1!.name} and ${p2!.name}`, ...state.logs],
  }
}

export const rejectTrade = (state: GameState, tradeId: string): GameState => {
  const trade = state.trades.find((t) => t.id === tradeId)
  if (!trade || trade.status !== 'PENDING') {
    return state
  }

  const p1 = state.players.find((p) => p.id === trade.toId)
  const p2 = state.players.find((p) => p.id === trade.fromId)

  const newTrades = state.trades.map((t) =>
    t.id === tradeId ? { ...t, status: 'REJECTED' as const } : t,
  )

  const logEntry =
    p1 && p2
      ? { key: 'tradeRejected', params: { name: p1.name, partner: p2.name } }
      : `A trade offer was rejected.`

  return {
    ...state,
    trades: newTrades,
    logs: [logEntry, ...state.logs],
  }
}

export const cancelTrade = (state: GameState, tradeId: string): GameState => {
  const trade = state.trades.find((t) => t.id === tradeId)
  if (!trade || trade.status !== 'PENDING') {
    return state
  }

  const newTrades = state.trades.filter((t) => t.id !== tradeId)

  return {
    ...state,
    trades: newTrades,
    logs: [`A trade offer was canceled.`, ...state.logs],
  }
}
