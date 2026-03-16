import { performance } from 'perf_hooks'

interface Player {
  id: string
  position: number
  properties: number[]
}

interface Tile {
  id: number
}

const numTiles = 24
const numPlayers = 4
const numIterations = 100000

const tiles: Tile[] = Array.from({ length: numTiles }, (_, i) => ({ id: i }))
const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
  id: `p${i}`,
  position: Math.floor(Math.random() * numTiles),
  properties: [i * 2, i * 2 + 1, i * 2 + 2],
}))

// Simulate current O(T*P) approach
function renderOldWay() {
  for (const tile of tiles) {
    const tilePlayers = players.filter((p) => p.position === tile.id)
    const owner = players.find((p) => p.properties.includes(tile.id))
    // Simulate some work with tilePlayers and owner
    if (tilePlayers.length > 0 || owner) {
      // do nothing
    }
  }
}

// Simulate proposed O(T + P) approach
function renderNewWay() {
  // Compute maps once per render (or useMemo)
  const playersByPosition: Record<number, Player[]> = {}
  const ownerByTile: Record<number, Player> = {}

  for (const p of players) {
    if (!playersByPosition[p.position]) {
      playersByPosition[p.position] = []
    }
    playersByPosition[p.position].push(p)

    for (const propId of p.properties) {
      ownerByTile[propId] = p
    }
  }

  for (const tile of tiles) {
    const tilePlayers = playersByPosition[tile.id] || []
    const owner = ownerByTile[tile.id]
    // Simulate some work with tilePlayers and owner
    if (tilePlayers.length > 0 || owner) {
      // do nothing
    }
  }
}

function runBenchmark() {
  console.log(
    `Running benchmark with ${numTiles} tiles and ${numPlayers} players over ${numIterations} renders...`,
  )

  const startOld = performance.now()
  for (let i = 0; i < numIterations; i++) {
    renderOldWay()
  }
  const endOld = performance.now()
  const timeOld = endOld - startOld

  const startNew = performance.now()
  for (let i = 0; i < numIterations; i++) {
    renderNewWay()
  }
  const endNew = performance.now()
  const timeNew = endNew - startNew

  console.log(`Old way (O(T*P)): ${timeOld.toFixed(2)} ms`)
  console.log(`New way (O(T+P)): ${timeNew.toFixed(2)} ms`)
  console.log(`Speedup: ${(timeOld / timeNew).toFixed(2)}x`)
}

runBenchmark()
