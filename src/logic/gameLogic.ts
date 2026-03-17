import type { GameState, Player, Tile, TradeOffer } from '../types/game.ts'
import { GAME_CONFIG } from '../config/gameConfig.ts'
import { BOARD_DATA } from '../config/gameConfig.ts'

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

      newState.players = newPlayers
      newState.logs = [
        { key: 'paidRent', params: { name: player.name, amount: rent, owner: owner.name } },
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
    newState.prison = {
      ...newState.prison,
      [player.id]: { turnsLeft: 2 },
    }
    newState.logs = [`${player.name} was sent to Prison!`, ...newState.logs]
    newState.turnPhase = 'END'
  }

  return newState
}

const calculateRent = (tile: Tile, owner: Player, allTiles: Tile[]): number => {
  if (tile.type === 'PROPERTY') {
    return tile.rent ? tile.rent[0] : 0
  }
  if (tile.type === 'AIRPORT') {
    const airportCount = allTiles.filter(
      (t) => t.type === 'AIRPORT' && owner.properties.includes(t.id),
    ).length
    return 25 * Math.pow(2, airportCount - 1)
  }
  return 25
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
        newState.logs = [`${nextPlayer.name} is in Prison for ${prisonRecord.turnsLeft - 1} more turn(s).`, ...newState.logs]
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

  return {
    ...newState,
    currentPlayerIndex: nextIndex,
    turnPhase: 'ROLL',
  }
}

export const executeTrade = (
  state: GameState,
  p1Id: string,
  p2Id: string,
  offer: TradeOffer,
): GameState => {
  const p1 = state.players.find((p) => p.id === p1Id)
  const p2 = state.players.find((p) => p.id === p2Id)

  if (!p1 || !p2) {
    return {
      ...state,
      logs: [`Trade failed: One or both players not found.`, ...state.logs],
    }
  }

  // Validate cash
  if (p1.balance < offer.myCash || p2.balance < offer.partnerCash) {
    return {
      ...state,
      logs: [`Trade failed: Insufficient funds.`, ...state.logs],
    }
  }

  // Validate properties
  const p1OwnsAll = offer.myProperties.every((id) => p1.properties.includes(id))
  const p2OwnsAll = offer.partnerProperties.every((id) => p2.properties.includes(id))

  if (!p1OwnsAll || !p2OwnsAll) {
    return {
      ...state,
      logs: [`Trade failed: Properties not owned.`, ...state.logs],
    }
  }

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

  return {
    ...state,
    players: newPlayers,
    logs: [`Trade executed between ${p1.name} and ${p2.name}`, ...state.logs],
  }
}
