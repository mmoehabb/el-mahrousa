import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Info, Settings2, X } from 'lucide-react'
import { useGame } from '../context/GameContext'
import Board from './Board'
import TradeModal from './TradeModal'
import GameControls from './GameControls'
import type { TradeOffer, GameAction } from '../types/game'
import { GAME_CONFIG } from '../config/gameConfig'
import { AnimatePresence, motion } from 'framer-motion'

interface GameScreenProps {
  lobbyId: string | null
  sendAction: (action: GameAction) => void
  showCopied: boolean
  handleShareLink: () => void
}

const GameScreen: React.FC<GameScreenProps> = ({
  lobbyId,
  sendAction,
  showCopied,
  handleShareLink,
}) => {
  const { t } = useTranslation()
  const { gameState, myId } = useGame()
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

  const [showMobileLeft, setShowMobileLeft] = useState(false)
  const [showMobileRight, setShowMobileRight] = useState(false)

  const handleProposeTrade = (partnerId: string, offer: TradeOffer) => {
    sendAction({ type: 'PROPOSE_TRADE', partnerId, offer })
    setIsTradeOpen(false)
  }

  const playerInfoContent = (
    <div className="w-64 space-y-4">
      <div className="bg-white/90 p-4 rounded-lg shadow-md border-l-4 border-egyptian-blue rtl:border-r-4 rtl:border-l-0">
        <h3 className="font-bold flex items-center gap-2 mb-2">
          <Users size={18} /> {t('game.players')}
        </h3>

        <div className="space-y-2">
          {gameState.players.map((p, i) => (
            <div
              key={p.id}
              className={`flex justify-between items-center p-2 rounded min-w-0 ${
                i === gameState.currentPlayerIndex ? 'bg-egyptian-gold/20' : ''
              }`}
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
                  `tiles.${propName.toLowerCase().replace(/ /g, '-')}`
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
  )

  const controlsContent = (
    <GameControls
      gameState={gameState}
      isMyTurn={isMyTurn}
      handleRoll={handleRoll}
      handleBuy={handleBuy}
      handleEndTurn={handleEndTurn}
      setIsTradeOpen={setIsTradeOpen}
      sendAction={sendAction}
    />
  )

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 w-full max-w-7xl justify-center items-center lg:items-start relative">
      {/* Mobile Top Nav/FABs */}
      <div className="lg:hidden flex justify-between w-full max-w-full px-2">
        <button
          onClick={() => setShowMobileLeft(true)}
          className="bg-white/90 p-3 rounded-full shadow-lg border-2 border-egyptian-blue text-egyptian-blue z-20"
        >
          <Info size={24} />
        </button>
        <button
          onClick={() => setShowMobileRight(true)}
          className="bg-white/90 p-3 rounded-full shadow-lg border-2 border-egyptian-red text-egyptian-red z-20"
        >
          <Settings2 size={24} />
        </button>
      </div>

      <TradeModal
        isOpen={isTradeOpen}
        onClose={() => setIsTradeOpen(false)}
        players={gameState.players}
        myId={myId}
        allTiles={gameState.tiles}
        onPropose={handleProposeTrade}
      />

      {/* Desktop Left Panel */}
      <div className="hidden lg:block">
        {playerInfoContent}
      </div>

      {/* Center: Board - Scrollable wrapper for mobile */}
      <div className="w-full max-w-full overflow-auto flex justify-center pb-4 lg:pb-0 relative z-10 scale-90 sm:scale-100 origin-top">
        <Board handleRoll={handleRoll} isMyTurn={isMyTurn} sendAction={sendAction} />
      </div>

      {/* Desktop Right Panel */}
      <div className="hidden lg:block">
        {controlsContent}
      </div>

      {/* Mobile Modals */}
      <AnimatePresence>
        {showMobileLeft && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 z-50 flex bg-black/50"
          >
            <div className="bg-sand p-4 h-full w-80 overflow-y-auto shadow-2xl relative">
              <button
                onClick={() => setShowMobileLeft(false)}
                className="absolute top-4 right-4 rtl:left-4 rtl:right-auto bg-white rounded-full p-1"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold mb-4 mt-2">Info & Logs</h2>
              {playerInfoContent}
            </div>
          </motion.div>
        )}

        {showMobileRight && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed inset-0 z-50 flex justify-end bg-black/50"
          >
            <div className="bg-sand p-4 h-full w-80 overflow-y-auto shadow-2xl relative">
              <button
                onClick={() => setShowMobileRight(false)}
                className="absolute top-4 right-4 rtl:left-4 rtl:right-auto bg-white rounded-full p-1 z-50"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold mb-4 mt-2">Controls & Chat</h2>
              {controlsContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GameScreen
