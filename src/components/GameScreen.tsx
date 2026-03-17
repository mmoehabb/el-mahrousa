import React, { useState, useRef, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import Board, { DiceFace } from './Board'
import { useNetworking } from '../hooks/useNetworking'
import { motion, AnimatePresence } from 'framer-motion'
import { Dice5, Send, Users, Handshake, MessageSquare, Gamepad2, X } from 'lucide-react'
import { GAME_CONFIG } from '../config/gameConfig'
import TradeModal, { type TradeOffer } from './TradeModal'
import { useTranslation } from 'react-i18next'

const MAX_CHAT_LENGTH = 200

const sanitizeMessage = (msg: string): string => {
  return msg.slice(0, MAX_CHAT_LENGTH).replace(/[<>&"'`]/g, '')
}

const GameScreen: React.FC = () => {
  const { gameState, myId } = useGame()
  const { t } = useTranslation()
  const { lobbyId, sendAction } = useNetworking()
  const [chatMsg, setChatMsg] = useState('')
  const [isTradeOpen, setIsTradeOpen] = useState(false)
  const isRollingRef = useRef(false)
  const [showCopied, setShowCopied] = useState(false)

  const [activeTab, setActiveTab] = useState<'board' | 'players' | 'controls' | 'chat'>('board')

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const isMyTurn = currentPlayer?.id === myId

  const isRolling = gameState.turnPhase === 'ROLLING'
  const [rollingDice, setRollingDice] = useState<[number, number]>([1, 1])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isRolling) {
      interval = setInterval(() => {
        setRollingDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1])
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isRolling])

  const effectiveDisplayDice = isRolling ? rollingDice : gameState.lastDice

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

  const handleProposeTrade = (partnerId: string, offer: TradeOffer) => {
    sendAction({ type: 'PROPOSE_TRADE', partnerId, offer })
    setIsTradeOpen(false)
  }

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?lobby=${lobbyId}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    })
  }

  return (
    <div className="game-screen-wrapper relative w-full h-[100dvh] md:h-auto overflow-hidden md:overflow-visible flex flex-col items-center justify-start md:justify-center">
      <TradeModal
        isOpen={isTradeOpen}
        onClose={() => setIsTradeOpen(false)}
        players={gameState.players}
        myId={myId}
        allTiles={gameState.tiles}
        onPropose={handleProposeTrade}
      />

      {/* Main Game Content (Board & Desktop Panels) */}
      <div className="game-screen-content w-full h-full md:flex gap-8 max-w-7xl justify-center items-start pt-4 pb-20 md:pb-4 overflow-auto px-4">

        {/* Left Panel: Player Info (Desktop) / Modal (Mobile) */}
        <div className={`
          ${activeTab === 'players' ? 'fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4' : 'hidden'}
          md:block md:relative md:bg-transparent md:z-auto md:w-64 md:space-y-4 md:flex-shrink-0
        `}>
          <div className="bg-white/90 p-4 rounded-lg shadow-md border-l-4 border-egyptian-blue rtl:border-r-4 rtl:border-l-0 w-full max-w-sm md:max-w-none max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 md:hidden">
              <h3 className="font-bold flex items-center gap-2">
                <Users size={18} /> {t('game.players')}
              </h3>
              <button onClick={() => setActiveTab('board')} className="p-1 hover:bg-slate-200 rounded">
                <X size={20} />
              </button>
            </div>

            <h3 className="font-bold flex items-center gap-2 mb-2 hidden md:flex">
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
            <div className="space-y-2 mt-4">
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

        <div className={`
          ${activeTab === 'players' ? 'fixed inset-0 z-50 pointer-events-none flex items-end justify-center pb-24 p-4' : 'hidden'}
          md:block md:relative md:bg-transparent md:z-auto md:w-64 md:mt-4 md:pointer-events-auto
        `}>
          <div className="bg-white/90 p-4 rounded-lg shadow-md border-l-4 border-egyptian-gold rtl:border-r-4 rtl:border-l-0 pointer-events-auto w-full max-w-sm md:max-w-none">
            <h3 className="font-bold flex items-center gap-2 mb-2 uppercase text-sm">
              {t('game.gameLogs')}
            </h3>
            <div className="h-32 md:h-48 overflow-y-auto text-[10px] space-y-1 pr-2 rtl:pr-0 rtl:pl-2">
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
      </div>
      {/* End of Left Panel Wrapper */}

      {/* Center: Board */}
      <div className={`w-full max-w-fit mx-auto md:block flex-shrink-0 ${activeTab !== 'board' && 'hidden md:block'}`}>
        <div className="overflow-auto pb-4 px-2 w-full h-full flex justify-center items-start">
          <Board />
        </div>
      </div>

      {/* Right Panel: Controls & Chat (Desktop) / Modals (Mobile) */}
      <div className="w-64 space-y-4 flex-shrink-0 hidden md:block">

        {/* Desktop Controls */}
        <div className="bg-white/90 p-6 rounded-lg shadow-md border-r-4 border-egyptian-red text-center rtl:border-l-4 rtl:border-r-0">
          <div className="mb-4">
            <span className="text-xs text-slate-500 uppercase">
              {t('game.currentTurnLabel')}
            </span>
            <div className="font-bold text-lg">
              {currentPlayer?.name || t('game.waitingTurn')}
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {(gameState.turnPhase === 'ROLLING' || gameState.turnPhase === 'MOVING' || (gameState.turnPhase === 'ACTION' && gameState.lastDice[0] > 0)) && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex gap-4 bg-white/50 p-4 rounded-2xl backdrop-blur-md border border-white/50 shadow-xl justify-center mb-4"
                >
                  <motion.div
                    animate={gameState.turnPhase === 'ROLLING' ? { rotate: 360 } : {}}
                    transition={{
                      repeat: Infinity,
                      duration: 0.5,
                      ease: 'easeInOut',
                    }}
                  >
                    <DiceFace
                      value={effectiveDisplayDice[0]}
                      aria-label={`First die showing ${effectiveDisplayDice[0]}`}
                    />
                  </motion.div>
                  <motion.div
                    animate={gameState.turnPhase === 'ROLLING' ? { rotate: -360 } : {}}
                    transition={{
                      repeat: Infinity,
                      duration: 0.5,
                      ease: 'easeInOut',
                    }}
                  >
                    <DiceFace
                      value={effectiveDisplayDice[1]}
                      aria-label={`Second die showing ${effectiveDisplayDice[1]}`}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

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
      {/* End of Main Game Content Wrapper */}

      {/* End of Main Game Content Wrapper */}
      </div>

      {/* Mobile Modals for Controls and Chat */}
      <div className={`
        ${activeTab === 'controls' ? 'fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4' : 'hidden'}
        md:hidden
      `}>
        <div className="bg-white/90 p-6 rounded-lg shadow-md border-r-4 border-egyptian-red text-center rtl:border-l-4 rtl:border-r-0 w-full max-w-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Controls</h3>
            <button onClick={() => setActiveTab('board')} className="p-1 hover:bg-slate-200 rounded">
              <X size={20} />
            </button>
          </div>
          <div className="mb-4">
            <span className="text-xs text-slate-500 uppercase">
              {t('game.currentTurnLabel')}
            </span>
            <div className="font-bold text-lg">
              {currentPlayer?.name || t('game.waitingTurn')}
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {(gameState.turnPhase === 'ROLLING' || gameState.turnPhase === 'MOVING' || (gameState.turnPhase === 'ACTION' && gameState.lastDice[0] > 0)) && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex gap-4 bg-white/50 p-4 rounded-2xl backdrop-blur-md border border-white/50 shadow-xl justify-center mb-4"
                >
                  <motion.div
                    animate={gameState.turnPhase === 'ROLLING' ? { rotate: 360 } : {}}
                    transition={{
                      repeat: Infinity,
                      duration: 0.5,
                      ease: 'easeInOut',
                    }}
                  >
                    <DiceFace
                      value={effectiveDisplayDice[0]}
                      aria-label={`First die showing ${effectiveDisplayDice[0]}`}
                    />
                  </motion.div>
                  <motion.div
                    animate={gameState.turnPhase === 'ROLLING' ? { rotate: -360 } : {}}
                    transition={{
                      repeat: Infinity,
                      duration: 0.5,
                      ease: 'easeInOut',
                    }}
                  >
                    <DiceFace
                      value={effectiveDisplayDice[1]}
                      aria-label={`Second die showing ${effectiveDisplayDice[1]}`}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {gameState.turnPhase === 'ROLL' && (
              <button
                onClick={() => { handleRoll(); setActiveTab('board') }}
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
                      onClick={() => { handleBuy(); setActiveTab('board') }}
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
                  onClick={() => { handleEndTurn(); setActiveTab('board') }}
                  disabled={!isMyTurn}
                  className="w-full bg-slate-500 text-white py-2 rounded-lg font-bold hover:bg-slate-600 text-[10px]"
                >
                  {t('game.skipEndTurnBtn')}
                </button>
              </div>
            )}

            {gameState.turnPhase === 'END' && (
              <button
                onClick={() => { handleEndTurn(); setActiveTab('board') }}
                disabled={!isMyTurn}
                className="w-full bg-egyptian-blue text-white py-2 rounded-lg font-bold text-[10px]"
              >
                {t('game.endTurnBtn')}
              </button>
            )}

            <button
              onClick={() => { setIsTradeOpen(true); setActiveTab('board') }}
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
      </div>

      <div className={`
        ${activeTab === 'chat' ? 'fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4' : 'hidden'}
        md:hidden
      `}>
        <div className="bg-white/90 p-4 rounded-lg shadow-md border-r-4 border-slate-400 rtl:border-l-4 rtl:border-r-0 w-full max-w-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Chat</h3>
            <button onClick={() => setActiveTab('board')} className="p-1 hover:bg-slate-200 rounded">
              <X size={20} />
            </button>
          </div>
          <div className="h-64 flex flex-col">
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

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 flex justify-around p-2 z-40 pb-safe">
        <button
          onClick={() => setActiveTab('players')}
          className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'players' ? 'text-egyptian-blue bg-blue-50' : 'text-slate-500'}`}
        >
          <Users size={24} />
          <span className="text-[10px] font-bold mt-1">Players</span>
        </button>
        <button
          onClick={() => setActiveTab('board')}
          className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'board' ? 'text-egyptian-gold bg-yellow-50' : 'text-slate-500'}`}
        >
          <Gamepad2 size={24} />
          <span className="text-[10px] font-bold mt-1">Board</span>
        </button>
        <button
          onClick={() => setActiveTab('controls')}
          className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'controls' ? 'text-egyptian-red bg-red-50' : 'text-slate-500 relative'}`}
        >
          {isMyTurn && gameState.turnPhase === 'ROLL' && (
            <span className="absolute top-1 right-2 w-3 h-3 bg-red-500 rounded-full animate-ping" />
          )}
          <Dice5 size={24} />
          <span className="text-[10px] font-bold mt-1">Controls</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'chat' ? 'text-slate-800 bg-slate-100' : 'text-slate-500'}`}
        >
          <MessageSquare size={24} />
          <span className="text-[10px] font-bold mt-1">Chat</span>
        </button>
      </div>
    </div>
  )
}

export default GameScreen
