import { useState, useRef } from 'react'
import { useGame } from './context/GameContext'
import Board from './components/Board'
import { useNetworking } from './hooks/useNetworking'
import { Users } from 'lucide-react'
import { useEffect } from 'react'
import { GAME_CONFIG } from './config/gameConfig'
import TradeModal from './components/TradeModal'
import type { TradeOffer } from './types/game'
import LoginScreen from './components/LoginScreen'
import LobbyScreen from './components/LobbyScreen'
import WaitingScreen from './components/WaitingScreen'
import GameControls from './components/GameControls'
import { useTranslation } from 'react-i18next'
import SettingsModal from './components/SettingsModal'
import { Settings } from 'lucide-react'

function App() {
  const { gameState, myId, playerName, isHost } = useGame()
  const { t } = useTranslation()
  const { createLobby, joinLobby, lobbyId, sendAction } = useNetworking()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isTradeOpen, setIsTradeOpen] = useState(false)
  const isRollingRef = useRef(false)

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const isMyTurn = currentPlayer?.id === myId

  // Handle auto-advance for dice roll and movement animations
  useEffect(() => {
    if (!isMyTurn || gameState.status !== 'PLAYING') return

    if (gameState.turnPhase === 'ROLLING') {
      const timer = setTimeout(() => {
        sendAction({ type: 'FINISH_ROLL' })
      }, 1500) // Wait 1.5s for dice animation
      return () => clearTimeout(timer)
    }

    if (gameState.turnPhase === 'MOVING') {
      const timer = setTimeout(() => {
        sendAction({ type: 'MOVE_STEP' })
      }, 300) // 300ms per step hop
      return () => clearTimeout(timer)
    }
  }, [gameState.turnPhase, gameState.stepsLeft, isMyTurn, sendAction, gameState.status])

  const handleRoll = () => {
    if (isRollingRef.current) return
    isRollingRef.current = true
    sendAction({ type: 'ROLL' })
    setTimeout(() => {
      isRollingRef.current = false
    }, 2000)
  }
  const handleBuy = () => sendAction({ type: 'BUY' })
  const handleEndTurn = () => sendAction({ type: 'END_TURN' })

  const [showCopied, setShowCopied] = useState(false)

  const handleProposeTrade = (partnerId: string, offer: TradeOffer) => {
    sendAction({ type: 'PROPOSE_TRADE', partnerId, offer })
    setIsTradeOpen(false)
  }

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
        <div className="flex gap-8 w-full max-w-7xl justify-center">
          <TradeModal
            isOpen={isTradeOpen}
            onClose={() => setIsTradeOpen(false)}
            players={gameState.players}
            myId={myId}
            allTiles={gameState.tiles}
            onPropose={handleProposeTrade}
          />

          {/* Left Panel: Player Info */}
          <div className="w-64 space-y-4">
            <div className="bg-white/90 p-4 rounded-lg shadow-md border-l-4 border-egyptian-blue rtl:border-r-4 rtl:border-l-0">
              <h3 className="font-bold flex items-center gap-2 mb-2">
                <Users size={18} /> {t('game.players')}
              </h3>

              <div className="space-y-2">
                {gameState.players.map((p, i) => (
                  <div
                    key={p.id}
                    className={`flex justify-between items-center p-2 rounded min-w-0 ${i === gameState.currentPlayerIndex ? 'bg-egyptian-gold/20' : ''}`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="truncate" title={p.name}>
                        {p.name} {p.id === myId ? t('waiting.you') : ''}
                      </span>
                    </span>
                    <span className="font-bold text-xs shrink-0">
                      {p.balance} {GAME_CONFIG.CURRENCY}
                    </span>
                  </div>
                ))}
              </div>

              {lobbyId && (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-100 rounded border border-dashed border-slate-400 text-center">
                    <span className="text-xs text-slate-500 uppercase block">
                      {t('game.shareIdLabel')}
                    </span>
                    <span className="font-mono font-bold select-all">{lobbyId}</span>
                  </div>
                  <button
                    onClick={handleShareLink}
                    className="w-full bg-slate-200 text-slate-800 py-2 rounded-lg font-bold hover:bg-slate-300 transition-colors relative"
                  >
                    {showCopied ? t('game.copiedBtn') : t('game.shareLinkBtn')}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white/90 p-4 rounded-lg shadow-md border-l-4 border-egyptian-gold rtl:border-r-4 rtl:border-l-0">
              <h3 className="font-bold flex items-center gap-2 mb-2 uppercase text-sm">
                {t('game.gameLogs')}
              </h3>
              <div className="h-48 overflow-y-auto text-[10px] space-y-1 pr-2 rtl:pr-0 rtl:pl-2">
                {gameState.logs.map((log, i) => {
                  if (typeof log === 'string') {
                    return (
                      <div key={i} className="border-b border-slate-100 pb-1">
                        {log}
                      </div>
                    )
                  }
                  if (log.key) {
                    const translatedParams = { ...log.params }
                    if (translatedParams.property) {
                      const propName = String(translatedParams.property)
                      translatedParams.property = t(
                        `tiles.${propName.toLowerCase().replace(/ /g, '-')}`,
                      )
                    }
                    return (
                      <div key={i} className="border-b border-slate-100 pb-1">
                        {t(`logs.${log.key}`, translatedParams) as string}
                      </div>
                    )
                  }
                  return (
                    <div key={i} className="border-b border-slate-100 pb-1">
                      {JSON.stringify(log)}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Center: Board */}
          <Board />

          {/* Right Panel: Controls & Chat */}
          <GameControls
            gameState={gameState}
            isMyTurn={isMyTurn}
            handleRoll={handleRoll}
            handleBuy={handleBuy}
            handleEndTurn={handleEndTurn}
            setIsTradeOpen={setIsTradeOpen}
            sendAction={sendAction}
          />
        </div>
      )}
    </div>
  )
}

export default App
