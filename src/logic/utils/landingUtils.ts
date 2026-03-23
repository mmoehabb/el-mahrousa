import type { GameState, Player, Tile } from '../../types/game.ts'
import { GAME_CONFIG } from '../../config/gameConfig.ts'

export const calculateRent = (tile: Tile, owner: Player, allTiles: Tile[]): number => {
  if (tile.type === 'PROPERTY') {
    if (!tile.rent) return 0
    const houses = tile.houses || 0
    return tile.rent[houses] || tile.rent[0]
  }
  if (tile.type === 'AIRPORT' || tile.type === 'UTILITY') {
    const count = allTiles.filter(
      (t) => (t.type === 'AIRPORT' || t.type === 'UTILITY') && owner.properties.includes(t.id),
    ).length
    return 25 * Math.pow(2, count - 1)
  }
  return 25
}

export const handleTaxLanding = (state: GameState): GameState => {
  const player = state.players[state.currentPlayerIndex]
  const tile = state.tiles[player.position]
  const taxAmount = tile.price || 0
  const newPlayers = [...state.players]

  newPlayers[state.currentPlayerIndex] = {
    ...player,
    balance: player.balance - taxAmount,
  }

  const newState = { ...state, players: newPlayers }
  newState.logs = [
    `${player.name} paid ${taxAmount} ${GAME_CONFIG.CURRENCY} in tax`,
    ...newState.logs,
  ]

  if (newPlayers[state.currentPlayerIndex].balance >= 0) {
    newState.turnPhase = 'END'
  }

  return newState
}

export const handlePropertyLanding = (state: GameState): GameState => {
  const player = state.players[state.currentPlayerIndex]
  const tile = state.tiles[player.position]

  const owner = state.players.find((p) => p.properties.includes(tile.id))

  if (owner && owner.id !== player.id && !owner.isBankrupt) {
    const rent = calculateRent(tile, owner, state.tiles)
    const newPlayers = [...state.players]

    newPlayers[state.currentPlayerIndex] = {
      ...player,
      balance: player.balance - rent,
    }

    const ownerIndex = newPlayers.findIndex((p) => p.id === owner.id)
    newPlayers[ownerIndex] = {
      ...newPlayers[ownerIndex],
      balance: newPlayers[ownerIndex].balance + rent,
    }

    const newState = { ...state, players: newPlayers }
    newState.logs = [
      { key: 'paidRent', params: { name: player.name, amount: rent, owner: owner.name } },
      ...newState.logs,
    ]

    if (newPlayers[state.currentPlayerIndex].balance >= 0) {
      newState.turnPhase = 'END'
    }

    return newState
  }

  return state
}

export const handlePrisonLanding = (state: GameState): GameState => {
  const player = state.players[state.currentPlayerIndex]
  const newPlayers = [...state.players]

  newPlayers[state.currentPlayerIndex] = {
    ...player,
    position: 6,
  }

  const newState = { ...state, players: newPlayers }
  newState.prison = {
    ...newState.prison,
    [player.id]: { turnsLeft: 2 },
  }
  newState.logs = [`${player.name} was sent to Prison!`, ...newState.logs]
  newState.turnPhase = 'END'

  return newState
}
