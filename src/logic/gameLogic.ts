import type { GameState, Player, Tile } from '../types/game'
import { GAME_CONFIG } from '../config/gameConfig'
import { BOARD_DATA } from '../config/gameConfig'

export const createInitialState = (): GameState => ({
  players: [],
  currentPlayerIndex: 0,
  tiles: BOARD_DATA,
  status: 'LOBBY',
  turnPhase: 'ROLL',
  lastDice: [1, 1],
  propertyOwners: {},
  logs: ['Welcome to Misr-opoly!'],
  countdown: null,
  chatMessages: [],
})

export const rollDice = (): [number, number] => {
  return [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]
}

export const moveOneStep = (state: GameState): GameState => {
  const player = state.players[state.currentPlayerIndex]
  let newPosition = (player.position + 1) % state.tiles.length

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
      `${player.name} passed GO and collected ${GAME_CONFIG.GO_REWARD} ${GAME_CONFIG.CURRENCY}`,
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

export const applyLandingLogic = (state: GameState): GameState => {
  const player = state.players[state.currentPlayerIndex]
  const tile = state.tiles[player.position]
  const newState = { ...state }

  if (tile.type === 'TAX') {
    const taxAmount = tile.price || 0
    const newPlayers = [...state.players]
    newPlayers[state.currentPlayerIndex] = {
      ...player,
      balance: player.balance - taxAmount,
    }
    newState.players = newPlayers
    newState.logs = [
      `${player.name} paid ${taxAmount} ${GAME_CONFIG.CURRENCY} in tax`,
      ...newState.logs,
    ]
    newState.turnPhase = 'END'
  } else if (tile.type === 'PROPERTY' || tile.type === 'AIRPORT' || tile.type === 'UTILITY') {
    const ownerId = state.propertyOwners[tile.id]
    const owner = ownerId ? state.players.find((p) => p.id === ownerId) : null
    if (owner && owner.id !== player.id && !owner.isBankrupt) {
      const rent = calculateRent(tile, owner, state.tiles, state.propertyOwners)
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

      newState.players = newPlayers
      newState.logs = [
        `${player.name} paid ${rent} ${GAME_CONFIG.CURRENCY} rent to ${owner.name}`,
        ...newState.logs,
      ]
      newState.turnPhase = 'END'
    }
  } else if (tile.name === 'Go To Prison') {
    const newPlayers = [...state.players]
    newPlayers[state.currentPlayerIndex] = {
      ...player,
      position: 6,
    }
    newState.players = newPlayers
    newState.logs = [`${player.name} was sent to Prison!`, ...newState.logs]
    newState.turnPhase = 'END'
  }

  return newState
}

const calculateRent = (
  tile: Tile,
  owner: Player,
  allTiles: Tile[],
  propertyOwners: Record<number, string>,
): number => {
  if (tile.type === 'PROPERTY') {
    return tile.rent ? tile.rent[0] : 0
  }
  if (tile.type === 'AIRPORT') {
    const airportCount = allTiles.filter(
      (t) => t.type === 'AIRPORT' && propertyOwners[t.id] === owner.id,
    ).length
    return 25 * Math.pow(2, airportCount - 1)
  }
  return 25
}

export const buyProperty = (state: GameState, tileId: number): GameState => {
  const player = state.players[state.currentPlayerIndex]
  const tile = state.tiles[tileId]

  const isOwned = !!state.propertyOwners[tileId]
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
    propertyOwners: {
      ...state.propertyOwners,
      [tileId]: player.id,
    },
    logs: [
      `${player.name} bought ${tile.name} for ${tile.price} ${GAME_CONFIG.CURRENCY}`,
      ...state.logs,
    ],
    turnPhase: 'END',
  }
}

export const endTurn = (state: GameState): GameState => {
  let nextIndex = (state.currentPlayerIndex + 1) % state.players.length
  let attempts = 0
  while (state.players[nextIndex].isBankrupt && attempts < state.players.length) {
    nextIndex = (nextIndex + 1) % state.players.length
    attempts++
  }

  return {
    ...state,
    currentPlayerIndex: nextIndex,
    turnPhase: 'ROLL',
  }
}

export const executeTrade = (
  state: GameState,
  p1Id: string,
  p2Id: string,
  offer: any,
): GameState => {
  const newPlayers = state.players.map((p) => {
    if (p.id === p1Id) {
      return {
        ...p,
        balance: p.balance - offer.myCash + offer.partnerCash,
        properties: p.properties
          .filter((id: number) => !offer.myProperties.includes(id))
          .concat(offer.partnerProperties),
      }
    }
    if (p.id === p2Id) {
      return {
        ...p,
        balance: p.balance - offer.partnerCash + offer.myCash,
        properties: p.properties
          .filter((id: number) => !offer.partnerProperties.includes(id))
          .concat(offer.myProperties),
      }
    }
    return p
  })

  const newPropertyOwners = { ...state.propertyOwners }
  offer.myProperties.forEach((id: number) => {
    newPropertyOwners[id] = p2Id
  })
  offer.partnerProperties.forEach((id: number) => {
    newPropertyOwners[id] = p1Id
  })

  return {
    ...state,
    players: newPlayers,
    propertyOwners: newPropertyOwners,
    logs: [`Trade executed between ${p1Id} and ${p2Id}`, ...state.logs],
  }
}
