import { useState } from 'react'
import { useGame } from './context/GameContext'
import { useNetworking } from './hooks/useNetworking'
import { useEffect } from 'react'
import LoginScreen from './components/LoginScreen'
import LobbyScreen from './components/LobbyScreen'
import WaitingScreen from './components/WaitingScreen'
import GameScreen from './components/GameScreen'
import { useTranslation } from 'react-i18next'
import SettingsModal from './components/SettingsModal'
import { Settings } from 'lucide-react'

function App() {
  const { gameState, playerName, isHost, myId } = useGame()
  const { t } = useTranslation()
  const { createLobby, joinLobby, lobbyId, sendAction } = useNetworking()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showCopied, setShowCopied] = useState(false)

  useEffect(() => {
    if (playerName && gameState.status === 'LOBBY') {
      const urlParams = new URLSearchParams(window.location.search)
      const lobbyFromUrl = urlParams.get('lobby')
      if (lobbyFromUrl) {
        joinLobby(lobbyFromUrl)
        // Clean up the URL
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [playerName, gameState.status, joinLobby])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isHost && gameState.status === 'WAITING' && gameState.countdown !== null) {
      interval = setInterval(() => {
        sendAction({ type: 'TICK_COUNTDOWN' })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isHost, gameState.status, gameState.countdown, sendAction])

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?lobby=${lobbyId}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    })
  }

  if (!playerName) {
    return <LoginScreen />
  }

  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      {gameState.status === 'LOBBY' ? (
        <>
          <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 p-2 rounded-lg font-bold transition-colors flex items-center justify-center shadow-md"
              aria-label={t('common.settings.title')}
            >
              <Settings size={24} className="text-egyptian-blue" />
            </button>
          </div>
          <LobbyScreen createLobby={createLobby} joinLobby={joinLobby} />
        </>
      ) : gameState.status === 'WAITING' ? (
        <WaitingScreen
          gameState={gameState}
          myId={myId}
          isHost={isHost}
          lobbyId={lobbyId}
          showCopied={showCopied}
          handleShareLink={handleShareLink}
          sendAction={sendAction}
        />
      ) : (
        <GameScreen />
      )}
    </div>
  )
}

export default App