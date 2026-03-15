import { useState, useRef } from 'react'
import { useGame } from './context/GameContext'
import Board from './components/Board'
import { useNetworking } from './hooks/useNetworking'
import { Dice5, Send, Users, Handshake } from 'lucide-react'
import { useEffect } from 'react'
import { GAME_CONFIG } from './config/gameConfig'
import TradeModal, { type TradeOffer } from './components/TradeModal'
import LoginScreen from './components/LoginScreen'
import { useTranslation } from 'react-i18next'

const MAX_CHAT_LENGTH = 200

const sanitizeMessage = (msg: string): string => {
  return msg.slice(0, MAX_CHAT_LENGTH).replace(/[<>&"'`]/g, '')
}

function App() {
  const { gameState, myId, playerName, isHost } = useGame()
  const { t, i18n } = useTranslation()
  const { createLobby, joinLobby, lobbyId, sendAction } = useNetworking()
  const [joinId, setJoinId] = useState('')
  const [joinError, setJoinError] = useState('')
  const [chatMsg, setChatMsg] = useState('')
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

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    const sanitized = sanitizeMessage(chatMsg)
    if (!sanitized.trim()) return
    sendAction({ type: 'CHAT', message: sanitized })
    setChatMsg('')
  }

  const [showCopied, setShowCopied] = useState(false)

  const handleProposeTrade = (partnerId: string, offer: TradeOffer) => {
    sendAction({ type: 'PROPOSE_TRADE', partnerId, offer })
    setIsTradeOpen(false)
  }

  const handleJoinLobby = () => {
    const sanitizedId = joinId.trim().replace(/[<>&"'`]/g, '')
    if (!sanitizedId) {
      setJoinError(t('lobby.errorEmpty'))
      return
    }
    setJoinError('')
    joinLobby(sanitizedId)
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

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en')
  }

  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      {gameState.status === 'LOBBY' ? (
        <>
          <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto">
            <button
              onClick={toggleLanguage}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-lg font-bold transition-colors"
            >
              {i18n.language === 'en'
                ? t('common.languageToggle.ar')
                : t('common.languageToggle.en')}
            </button>
          </div>
          <div className="max-w-md w-full bg-white/90 p-8 rounded-xl shadow-xl border-t-4 border-egyptian-gold mt-20">
            <h1 className="text-3xl font-bold text-center mb-6 text-egyptian-blue uppercase tracking-widest">
              {t('lobby.title')}
            </h1>

            <div className="space-y-4">
              <button
                onClick={createLobby}
                className="w-full bg-egyptian-gold text-white py-3 rounded-lg font-bold hover:bg-yellow-600 transition-colors"
              >
                {t('lobby.createNewLobby')}
              </button>

              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={t('lobby.lobbyIdInput')}
                    value={joinId}
                    onChange={(e) => {
                      setJoinId(e.target.value)
                      setJoinError('')
                    }}
                    className={`w-full border p-2 rounded-lg ${joinError ? 'border-red-500' : ''}`}
                    aria-describedby={joinError ? 'join-error' : undefined}
                  />
                  {joinError && (
                    <p id="join-error" className="text-red-500 text-xs mt-1" role="alert">
                      {joinError}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleJoinLobby}
                  className="bg-egyptian-blue text-white px-4 py-2 rounded-lg font-bold"
                >
                  {t('lobby.joinBtn')}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : gameState.status === 'WAITING' ? (
        <div className="max-w-md w-full bg-white/90 p-8 rounded-xl shadow-xl border-t-4 border-egyptian-gold mt-20">
          <h1 className="text-3xl font-bold text-center mb-6 text-egyptian-blue uppercase tracking-widest">
            {t('waiting.title')}
          </h1>

          <div className="space-y-6">
            <div className="p-4 bg-slate-100 rounded-lg border border-dashed border-slate-400 text-center">
              <span className="text-sm text-slate-500 uppercase block mb-1">
                {t('waiting.lobbyIdLabel')}
              </span>
              <span
                className="font-mono text-xl font-bold select-all block mb-2 truncate"
                title={lobbyId}
              >
                {lobbyId}
              </span>
              <button
                onClick={handleShareLink}
                className="w-full bg-slate-200 text-slate-800 py-2 rounded-lg font-bold hover:bg-slate-300 transition-colors"
              >
                {showCopied ? t('game.copiedBtn') : t('game.shareLinkBtn')}
              </button>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <h3 className="font-bold flex items-center gap-2 mb-3 text-egyptian-blue">
                <Users size={18} /> {t('waiting.playersCount', { count: gameState.players.length })}
              </h3>
              <div className="space-y-2">
                {gameState.players.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="font-semibold truncate" title={p.name}>
                      {p.name} {p.id === myId ? t('waiting.you') : ''}
                    </span>
                    {p.id === gameState.players[0].id && (
                      <span className="text-xs bg-egyptian-gold text-white px-2 py-0.5 rounded ltr:ml-auto rtl:mr-auto">
                        {t('waiting.host')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-center">
              {isHost ? (
                gameState.countdown === null ? (
                  <button
                    onClick={() => sendAction({ type: 'START_COUNTDOWN' })}
                    className="w-full bg-egyptian-blue text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors text-lg"
                  >
                    {t('waiting.startGameBtn')}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="text-2xl font-black text-egyptian-red animate-pulse">
                      {t('waiting.startingIn', { count: gameState.countdown })}
                    </div>
                    <button
                      onClick={() => sendAction({ type: 'CANCEL_COUNTDOWN' })}
                      className="w-full bg-slate-300 text-slate-700 py-2 rounded-lg font-bold hover:bg-slate-400 transition-colors"
                    >
                      {t('waiting.cancelBtn')}
                    </button>
                  </div>
                )
              ) : (
                <div className="p-4 bg-blue-50 text-blue-800 rounded-lg font-semibold animate-pulse">
                  {gameState.countdown !== null
                    ? t('waiting.startingIn', { count: gameState.countdown })
                    : t('waiting.waitingForHost')}
                </div>
              )}
            </div>
          </div>
        </div>
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
          <div className="w-64 space-y-4">
            <div className="bg-white/90 p-6 rounded-lg shadow-md border-r-4 border-egyptian-red text-center rtl:border-l-4 rtl:border-r-0">
              <div className="mb-4">
                <span className="text-xs text-slate-500 uppercase">
                  {t('game.currentTurnLabel')}
                </span>
                <div className="font-bold text-lg">
                  {currentPlayer?.name || t('game.waitingTurn')}
                </div>
              </div>

              <div className="space-y-2">
                {gameState.turnPhase === 'ROLL' && (
                  <button
                    onClick={handleRoll}
                    disabled={!isMyTurn}
                    className="w-full bg-egyptian-blue text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 text-[10px]"
                  >
                    <Dice5 /> {t('game.rollDiceBtn')}
                  </button>
                )}

                {gameState.turnPhase === 'ACTION' && (
                  <div className="space-y-2">
                    {gameState.tiles[currentPlayer.position]?.price &&
                      !gameState.players.some((p) =>
                        p.properties.includes(currentPlayer.position),
                      ) && (
                        <button
                          onClick={handleBuy}
                          disabled={
                            !isMyTurn ||
                            currentPlayer.balance <
                              (gameState.tiles[currentPlayer.position].price || 0)
                          }
                          className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 text-[10px]"
                        >
                          {t('game.buyForBtn', {
                            price: gameState.tiles[currentPlayer.position].price,
                          })}
                        </button>
                      )}
                    <button
                      onClick={handleEndTurn}
                      disabled={!isMyTurn}
                      className="w-full bg-slate-500 text-white py-2 rounded-lg font-bold hover:bg-slate-600 text-[10px]"
                    >
                      {t('game.skipEndTurnBtn')}
                    </button>
                  </div>
                )}

                {gameState.turnPhase === 'END' && (
                  <button
                    onClick={handleEndTurn}
                    disabled={!isMyTurn}
                    className="w-full bg-egyptian-blue text-white py-2 rounded-lg font-bold text-[10px]"
                  >
                    {t('game.endTurnBtn')}
                  </button>
                )}

                <button
                  onClick={() => setIsTradeOpen(true)}
                  className="w-full border-2 border-egyptian-gold text-egyptian-gold py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-egyptian-gold hover:text-white transition-all text-[10px]"
                >
                  <Handshake size={18} /> PROPOSE TRADE
                </button>

                <button
                  onClick={() => (window.location.href = '/')}
                  className="w-full bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition-all mt-4 text-[10px]"
                >
                  {t('game.leaveGameBtn')}
                </button>
              </div>
            </div>

            <div className="bg-white/90 p-4 rounded-lg shadow-md border-r-4 border-slate-400 rtl:border-l-4 rtl:border-r-0">
              <div className="h-40 flex flex-col">
                <div className="flex-1 overflow-y-auto text-xs space-y-2 mb-2 pr-1 rtl:pr-0 rtl:pl-1">
                  {gameState.chatMessages.length === 0 ? (
                    <div className="text-slate-400 italic">{t('game.chatReady')}</div>
                  ) : (
                    gameState.chatMessages.map((msg, i) => (
                      <div key={i} className="mb-1">
                        <span className="font-bold text-egyptian-blue">{msg.sender}: </span>
                        <span>{msg.message}</span>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSendChat} className="flex gap-1">
                  <input
                    type="text"
                    className="flex-1 min-w-0 border text-xs p-1 rounded"
                    placeholder={t('game.chatPlaceholder')}
                    value={chatMsg}
                    onChange={(e) => setChatMsg(e.target.value)}
                  />
                  <button type="submit" className="p-1 bg-slate-200 rounded rtl:rotate-180">
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
