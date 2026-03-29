import { useState } from 'react'
import { useGame } from './context/GameContext'
import { useNetworking } from './hooks/useNetworking'
import { useEffect } from 'react'
import LoginScreen from './components/LoginScreen'
import LobbyScreen from './components/LobbyScreen'
import WaitingScreen from './components/WaitingScreen'
import { useTranslation } from 'react-i18next'
import SettingsModal from './components/SettingsModal'
import { Settings, X } from 'lucide-react'
import GameScreen from './components/GameScreen'
import useSound from 'use-sound'
import Toast from './components/Toast'
import { useAdBreak } from './hooks/useAdBreak'
import AdBlockScreen from './components/AdBlockScreen'

function App() {
  const { gameState, myId, playerName, isHost, isBgmEnabled, bgmVolume, isAdblockDetected } =
    useGame()
  const [playBgm, { stop: stopBgm }] = useSound('/sounds/bgm.mp3', {
    loop: true,
    volume: bgmVolume,
  })
  const { t } = useTranslation()
  const { showInterstitialAd } = useAdBreak()
  const {
    createLobby,
    joinLobby,
    lobbyId,
    sendAction,
    toggleVoiceChat,
    isMuted,
    remoteStreams,
    voiceError,
    setVoiceError,
    hasJoinedVoice,
    connectionError,
    setConnectionError,
  } = useNetworking()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showCopied, setShowCopied] = useState(false)

  useEffect(() => {
    if (isBgmEnabled) {
      playBgm()
    } else {
      stopBgm()
    }
    return () => stopBgm()
  }, [isBgmEnabled, playBgm, stopBgm])

  useEffect(() => {
    if (playerName && gameState.status === 'LOBBY') {
      const urlParams = new URLSearchParams(window.location.search)
      const lobbyFromUrl = urlParams.get('lobby')
      if (lobbyFromUrl) {
        showInterstitialAd(() => {
          joinLobby(lobbyFromUrl)
        })
        // Clean up the URL
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [playerName, gameState.status, joinLobby, showInterstitialAd])

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

  if (isAdblockDetected) {
    return <AdBlockScreen />
  }

  return (
    <div
      className={`min-h-screen ${gameState.status === 'PLAYING' || gameState.status === 'FINISHED' ? '' : 'p-4'} flex flex-col items-center`}
    >
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <Toast message={voiceError ? t(voiceError) : null} onClose={() => setVoiceError?.(null)} />
      <Toast
        message={connectionError ? t(connectionError) : null}
        onClose={() => setConnectionError?.(null)}
      />
      <div
        className={`${gameState.status === 'PLAYING' || gameState.status === 'FINISHED' ? 'hidden lg:block ' : ''}fixed bottom-4 right-4 rtl:left-4 rtl:right-auto z-[60]`}
      >
        <button
          id="global-settings-btn"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="bg-slate-200 hover:bg-slate-300 text-slate-800 p-2 rounded-lg font-bold transition-colors flex items-center justify-center shadow-md"
          aria-label={isSettingsOpen ? t('common.settings.close') : t('common.settings.title')}
        >
          {isSettingsOpen ? (
            <X size={24} className="text-egyptian-blue" />
          ) : (
            <Settings size={24} className="text-egyptian-blue" />
          )}
        </button>
      </div>

      {!playerName ? (
        <LoginScreen />
      ) : gameState.status === 'LOBBY' ? (
        <LobbyScreen createLobby={createLobby} joinLobby={joinLobby} />
      ) : gameState.status === 'WAITING' ? (
        <WaitingScreen
          gameState={gameState}
          myId={myId}
          isHost={isHost}
          lobbyId={lobbyId}
          showCopied={showCopied}
          handleShareLink={handleShareLink}
          sendAction={sendAction}
          toggleVoiceChat={toggleVoiceChat}
          isMuted={isMuted}
          hasJoinedVoice={hasJoinedVoice}
        />
      ) : (
        <GameScreen
          lobbyId={lobbyId}
          sendAction={sendAction}
          showCopied={showCopied}
          handleShareLink={handleShareLink}
          toggleVoiceChat={toggleVoiceChat}
          isMuted={isMuted}
          hasJoinedVoice={hasJoinedVoice}
        />
      )}

      {/* Hidden audio elements for voice chat */}
      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <audio
          key={peerId}
          autoPlay
          ref={(audio) => {
            if (audio && audio.srcObject !== stream) {
              audio.srcObject = stream
            }
          }}
        />
      ))}
    </div>
  )
}

export default App
