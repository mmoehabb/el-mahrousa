import { TileType, type GameState, type Player, type Tile } from '../../types/game.ts'

export const calculateRent = (tile: Tile, owner: Player, allTiles: Tile[]): number => {
  if (tile.type === TileType.PROPERTY) {
    if (!tile.rent) return 0
    const houses = tile.houses || 0
    return tile.rent[houses] || tile.rent[0]
  }
  if (tile.type === TileType.AIRPORT || tile.type === TileType.UTILITY) {
    const count = allTiles.filter(
      (t) =>
        (t.type === TileType.AIRPORT || t.type === TileType.UTILITY) &&
        owner.properties.includes(t.id),
    ).length
    return 25 * Math.pow(2, count - 1)
  }
  return 25
}

export const handleTaxLanding = (state: GameState): GameState => {
  const player = state.players[state.currentPlayerIndex]
  const tile = state.tiles[player.position]

  let taxAmount = tile.price || 0
  if (tile.name === 'Income Tax') {
    taxAmount = Math.floor(
      player.balance * 0.025 + player.balance * player.properties.length * 0.005,
    )
  } else if (tile.name === 'Super Tax') {
    taxAmount = Math.floor(player.balance * 0.05 + player.balance * player.properties.length * 0.01)
  }

  const newPlayers = [...state.players]

  const newBalance = player.balance - taxAmount

  newPlayers[state.currentPlayerIndex] = {
    ...player,
    balance: newBalance,
  }

  if (newBalance < 0) {
    newPlayers[state.currentPlayerIndex].debtTo = 'bank'
  }

  const newState = { ...state, players: newPlayers }
  newState.logs = [
    { key: 'paidTax', params: { name: player.name, amount: taxAmount, property: tile.name } },
    ...newState.logs,
  ]

  if (newPlayers[state.currentPlayerIndex].balance >= 0) {
    newState.turnPhase = 'END'
  } else {
    newState.turnPhase = 'ACTION' // Must sell properties or bankrupt
  }

  return newState
}

export const handlePropertyLanding = (state: GameState): GameState => {
  const player = state.players[state.currentPlayerIndex]
  const tile = state.tiles[player.position]

  const tileOwners = new Map<number, Player>()
  for (const p of state.players) {
    for (const propId of p.properties) {
      tileOwners.set(propId, p)
    }
  }

  const owner = tileOwners.get(tile.id)

  if (owner && owner.id !== player.id && !owner.isBankrupt) {
    const rent = calculateRent(tile, owner, state.tiles)
    const newPlayers = [...state.players]

    const newBalance = player.balance - rent

    newPlayers[state.currentPlayerIndex] = {
      ...player,
      balance: newBalance,
    }

    if (newBalance < 0) {
      newPlayers[state.currentPlayerIndex].debtTo = owner.id
    }

    // Owner only gets what the player can pay immediately.
    // The rest will be paid when the player sells properties.
    const amountPaidImmediately = rent + (newBalance < 0 ? newBalance : 0)

    const ownerIndex = newPlayers.findIndex((p) => p.id === owner.id)
    newPlayers[ownerIndex] = {
      ...newPlayers[ownerIndex],
      balance: newPlayers[ownerIndex].balance + amountPaidImmediately,
    }

    const newState = { ...state, players: newPlayers }
    newState.logs = [
      { key: 'paidRent', params: { name: player.name, amount: rent, owner: owner.name } },
      ...newState.logs,
    ]

    if (newPlayers[state.currentPlayerIndex].balance >= 0) {
      newState.turnPhase = 'END'
    } else {
      newState.turnPhase = 'ACTION' // Must sell properties or bankrupt
    }

    return newState
  }

  return state
}

export const handlePrisonLanding = (state: GameState): GameState => {
  const player = state.players[state.currentPlayerIndex]
  const newPlayers = [...state.players]

  const prisonIndex = state.tiles.findIndex((t) => t.name === 'Prison')
  const finalPosition = prisonIndex !== -1 ? prisonIndex : 10 // Fallback to 10 if not found

  newPlayers[state.currentPlayerIndex] = {
    ...player,
    position: finalPosition,
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
