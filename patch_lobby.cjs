const fs = require('fs')

// Patch App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8')
appContent = appContent.replace('joinLobby(lobbyFromUrl)', 'joinLobby(lobbyFromUrl.toUpperCase())')
fs.writeFileSync('src/App.tsx', appContent)

// Patch LobbyScreen.tsx
let lobbyContent = fs.readFileSync('src/components/LobbyScreen.tsx', 'utf8')
lobbyContent = lobbyContent.replace(
  'joinLobby(sanitizedId)',
  'joinLobby(sanitizedId.toUpperCase())',
)
fs.writeFileSync('src/components/LobbyScreen.tsx', lobbyContent)
