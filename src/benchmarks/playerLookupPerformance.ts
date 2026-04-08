import { performance } from 'perf_hooks'

interface Player {
  id: string
  balance: number
  properties: number[]
  isBankrupt: boolean
}

const numPlayers = 8
const numIterations = 1000000

const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
  id: `p${i}`,
  balance: 1000,
  properties: [i * 2, i * 2 + 1],
  isBankrupt: false,
}))

const myId = 'p0'
const selectedTileId = 1

function benchmarkOldWay() {
  const me = players.find((p) => p.id === myId)
  const myBalance = me?.balance || 0
  const owner = players.find((p) => p.properties.includes(selectedTileId))
  const winner = players.find((p) => !p.isBankrupt)
  return { myBalance, owner, winner }
}

function benchmarkMemoizedWay(playersById: Map<string, Player>, ownerByTile: Record<number, Player>, me: Player | undefined) {
  const myBalance = me?.balance || 0
  const owner = ownerByTile[selectedTileId]
  const winner = players.find((p) => !p.isBankrupt)
  return { myBalance, owner, winner }
}

function runBenchmark() {
  console.log(`Running benchmark with ${numPlayers} players over ${numIterations} iterations (Assuming memoized data exists)...`)

  const startOld = performance.now()
  for (let i = 0; i < numIterations; i++) {
    benchmarkOldWay()
  }
  const endOld = performance.now()
  const timeOld = endOld - startOld

  const playersById = new Map(players.map(p => [p.id, p]))
  const ownerByTile: Record<number, Player> = {}
  players.forEach(p => {
    p.properties.forEach(propId => {
      ownerByTile[propId] = p
    })
  })
  const me = playersById.get(myId)

  const startNew = performance.now()
  for (let i = 0; i < numIterations; i++) {
    benchmarkMemoizedWay(playersById, ownerByTile, me)
  }
  const endNew = performance.now()
  const timeNew = endNew - startNew

  console.log(`Old way (multiple .find()): ${timeOld.toFixed(2)} ms`)
  console.log(`New way (lookup memoized data): ${timeNew.toFixed(2)} ms`)
  console.log(`Speedup: ${(timeOld / timeNew).toFixed(2)}x`)
}

runBenchmark()
