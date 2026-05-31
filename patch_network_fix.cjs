const fs = require('fs')
const file = 'src/hooks/useNetworking.ts'
let content = fs.readFileSync(file, 'utf8')

// The reviewer noticed I replaced from !== lobbyId with from !== myId in handleAction.
// This broke logic because handleAction runs on all clients (oops, the prompt told me handleAction
// runs on the host only, but actually all clients have the host's actions verified by `from === lobbyId`).
// Wait, the reviewer says "handleAction reducer executes on every client's machine... Remote peers will now reject all legitimate commands from the host".
// The host's connection ID used to be the same as their player ID, but now the host's connection ID is the lobbyId (from peer.connect/conn.peer).
// When the host broadcasts an ACTION or SYNC to peers, the peer receives it from `conn.peer`. Since `conn.peer === lobbyIdRef.current`, the peer verifies it's from the host by checking `conn.peer === lobbyIdRef.current`.
// But inside `handleAction`, we are receiving actions where `from` is the peer ID of the sender. For the host, the peer ID is `lobbyId`.
// So we need to undo the `from !== myId` changes and restore the host check, or properly map `from` to the host's player UUID when receiving data.

// Let's restore the from !== myId to the correct logic: if (from !== lobbyId && from !== gameState.players[0]?.id)
// Better yet, when the host sends an action, the peer receives it with `conn.peer === lobbyIdRef.current`.
content = content.replaceAll(
  'if (from !== myId && (!currentPlayer',
  'if (from !== lobbyId && from !== gameState.players[0]?.id && (!currentPlayer',
)
content = content.replaceAll(
  'if (from !== myId)',
  'if (from !== lobbyId && from !== gameState.players[0]?.id)',
)

// Map incoming action data connection
content = content.replace(
  'handleActionRef.current(d.action, conn.peer)',
  'handleActionRef.current(d.action, conn.peer === lobbyIdRef.current ? gameStateRef.current.players[0]?.id || conn.peer : conn.peer)',
)

content = content.replace(
  "handleActionRef.current({ type: 'PLAYER_DISCONNECT' }, conn.peer)",
  "handleActionRef.current({ type: 'PLAYER_DISCONNECT' }, conn.peer === lobbyIdRef.current ? gameStateRef.current.players[0]?.id || conn.peer : conn.peer)",
)

fs.writeFileSync(file, content)
