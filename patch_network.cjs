const fs = require('fs')
const file = 'src/hooks/useNetworking.ts'
let content = fs.readFileSync(file, 'utf8')

// import idGenerator
content = content.replace(
  "import { GAME_CONFIG } from '../config/gameConfig.ts'",
  "import { GAME_CONFIG } from '../config/gameConfig.ts'\nimport { generateLobbyId } from '../utils/idGenerator.ts'",
)

// Add localPeerId state
content = content.replace(
  "const [lobbyId, setLobbyId] = useState<string>('')",
  "const [lobbyId, setLobbyId] = useState<string>('')\n  const [localPeerId, setLocalPeerId] = useState<string>(myId)",
)

// Reset localPeerId when status is LOBBY
content = content.replace(
  'const [localPeerId, setLocalPeerId] = useState<string>(myId)',
  "const [localPeerId, setLocalPeerId] = useState<string>(myId)\n\n  useEffect(() => {\n    if (gameState.status === 'LOBBY') {\n      setLocalPeerId(myId)\n    }\n  }, [gameState.status, myId])",
)

// Replace from !== lobbyId with from !== myId in handleAction (host only check)
content = content.replaceAll('if (from !== lobbyId)', 'if (from !== myId)')
content = content.replaceAll(
  'if (from !== lobbyId && (!currentPlayer',
  'if (from !== myId && (!currentPlayer',
)
content = content.replaceAll('if (from !== lobbyId && from !== myId)', 'if (from !== myId)')

// Map call.peer to myId if call.peer === lobbyIdRef.current for incoming voice calls
content = content.replace(
  'setRemoteStreams((prev) => ({ ...prev, [call.peer]: remoteStream }))',
  'setRemoteStreams((prev) => ({ ...prev, [call.peer === lobbyIdRef.current ? gameStateRef.current.players[0]?.id : call.peer]: remoteStream }))',
)
content = content.replace(
  'delete newState[call.peer]',
  'delete newState[call.peer === lobbyIdRef.current ? gameStateRef.current.players[0]?.id : call.peer]',
)

// initiate voice call: determine peer ID
content = content.replace(
  'const call = peer.call(p.id, myStream)',
  'const targetPeerId = (p.id === gameStateRef.current.players[0]?.id && !isHostRef.current) ? lobbyIdRef.current : p.id\n          const call = peer.call(targetPeerId, myStream)',
)

content = content.replace(
  'const call = peer.call(p.id, stream)',
  'const targetPeerId = (p.id === gameStateRef.current.players[0]?.id && !isHostRef.current) ? lobbyIdRef.current : p.id\n              const call = peer.call(targetPeerId, stream)',
)

// change new Peer(myId, config) to new Peer(localPeerId, config)
content = content.replace(
  'const newPeer = new Peer(myId, config)',
  'const newPeer = new Peer(localPeerId, config)',
)
content = content.replace(
  '}, [myId, setGameState, iceServers])',
  '}, [localPeerId, setGameState, iceServers])',
)

// change setLobbyId(myId) inside createLobby
content = content.replace(
  'setLobbyId(myId)',
  'const newLobbyId = generateLobbyId()\n    setLocalPeerId(newLobbyId)\n    setLobbyId(newLobbyId)',
)

fs.writeFileSync(file, content)
