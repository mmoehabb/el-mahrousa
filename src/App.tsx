import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from './context/GameContext'
import { useNetworking } from './hooks/useNetworking'
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

const bgmTracks = ['/sounds/bgm.mp3', '/sounds/bgm2.mp3', '/sounds/bgm3.mp3', '/sounds/bgm4.mp3']

function App() {
  const { gameState, myId, playerName, isHost, isBgmEnabled, bgmVolume, isAdblockDetected } =
    useGame()

  const [currentBgmIndex, setCurrentBgmIndex] = useState(() =>
    Math.floor(Math.random() * bgmTracks.length),
  )

  const [playBgm, { stop: stopBgm }] = useSound(bgmTracks[currentBgmIndex], {
    volume: bgmVolume,
    onend: () => {
      let nextIndex = Math.floor(Math.random() * bgmTracks.length)
      while (nextIndex === currentBgmIndex) {
        nextIndex = Math.floor(Math.random() * bgmTracks.length)
      }
      setCurrentBgmIndex(nextIndex)
    },
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
    latency,
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

  const prevIsBgmEnabled = useRef(isBgmEnabled)
  useEffect(() => {
    if (!isBgmEnabled && prevIsBgmEnabled.current) {
      // Disable the rule specifically for this line as this is how we
      // trigger a track shuffle when music is paused.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentBgmIndex((prevIndex) => {
        let nextIndex = Math.floor(Math.random() * bgmTracks.length)
        while (nextIndex === prevIndex) {
          nextIndex = Math.floor(Math.random() * bgmTracks.length)
        }
        return nextIndex
      })
    }
    prevIsBgmEnabled.current = isBgmEnabled
  }, [isBgmEnabled])

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

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isHost && gameState.status === 'PLAYING') {
      interval = setInterval(() => {
        sendAction({ type: 'TICK_TURN_TIMER' })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isHost, gameState.status, sendAction])

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
    <>
      <div className="retro-clouds">
        <div className="cloud-grid" />
        <div className="cloud-layer cloud-1" />
        <div className="cloud-layer cloud-2" />
        <div className="cloud-layer cloud-3" />
      </div>
      <div className="retro-stars">
        <div className="star-grid" />
        <div className="star-layer star-1" />
        <div className="star-layer star-2" />
        <div className="star-layer star-3" />
      </div>
      <div
        className={`min-h-[100dvh] ${gameState.status === 'PLAYING' || gameState.status === 'FINISHED' ? '' : 'p-4'} flex flex-col items-center crt`}
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

        <AnimatePresence mode="wait">
          {!playerName ? (
            <motion.div
              key="login"
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="w-full flex justify-center"
            >
              <LoginScreen />
            </motion.div>
          ) : gameState.status === 'LOBBY' ? (
            <motion.div
              key="lobby"
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="w-full flex justify-center"
            >
              <LobbyScreen createLobby={createLobby} joinLobby={joinLobby} />
            </motion.div>
          ) : gameState.status === 'WAITING' ? (
            <motion.div
              key="waiting"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="w-full flex justify-center"
            >
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
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full h-full"
            >
              <GameScreen
                lobbyId={lobbyId}
                sendAction={sendAction}
                showCopied={showCopied}
                handleShareLink={handleShareLink}
                latency={latency}
                toggleVoiceChat={toggleVoiceChat}
                isMuted={isMuted}
                hasJoinedVoice={hasJoinedVoice}
              />
            </motion.div>
          )}
        </AnimatePresence>

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
    </>
  )
}

export default App
