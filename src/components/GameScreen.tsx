import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Info, Settings2, X, SmartphoneNfc } from 'lucide-react'
import { useGame } from '../context/GameContext'
import Board from './Board'
import TradeModal from './TradeModal'
import GameControls from './GameControls'
import WinnerModal from './WinnerModal'
import InformationDialog from './InformationDialog'
import type { GameAction } from '../types/game'
import { GAME_CONFIG } from '../config/gameConfig'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameSounds } from '../hooks/useGameSounds'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

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
  const { gameState, myId, isHost } = useGame()
  const [isTradeOpen, setIsTradeOpen] = useState(false)
  const isRollingRef = useRef(false)
  const sounds = useGameSounds()
  const prevPhaseRef = useRef(gameState.turnPhase)
  const prevLogsLengthRef = useRef(gameState.logs.length)
  const prevActiveEventRef = useRef(gameState.activeEvent)

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const isMyTurn = currentPlayer?.id === myId

  useEffect(() => {
    if (gameState.activeEvent && gameState.activeEvent !== prevActiveEventRef.current) {
      const type = gameState.activeEvent.type
      if (type === 'gain') sounds.playGo()
      if (type === 'loss') sounds.playRent()
      if (type === 'move') sounds.playMove()
      if (type === 'jail') sounds.playJail()

      prevActiveEventRef.current = gameState.activeEvent
    } else if (!gameState.activeEvent) {
      prevActiveEventRef.current = null
    }
  }, [gameState.activeEvent, sounds])

  useEffect(() => {
    // Phase change sounds
    if (prevPhaseRef.current !== gameState.turnPhase) {
      if (gameState.turnPhase === 'ROLLING') {
        sounds.playRoll()
      } else if (gameState.turnPhase === 'MOVING') {
        // play Move sounds progressively in the setTimeout logic below instead
      }
      prevPhaseRef.current = gameState.turnPhase
    }

    // Log-based sounds
    if (gameState.logs.length > prevLogsLengthRef.current) {
      const newLogs = gameState.logs.slice(0, gameState.logs.length - prevLogsLengthRef.current)

      newLogs.forEach((log) => {
        if (typeof log === 'string') {
          if (log.includes('paid') && log.includes('tax')) sounds.playRent()
          if (log.includes('Prison')) sounds.playJail()
          if (log.includes('bankrupt')) sounds.playBankrupt()
          if (log.includes('won')) sounds.playWin()
        } else if (log.key) {
          if (log.key === 'passedStart') sounds.playGo()
          if (log.key === 'paidRent') sounds.playRent()
          if (log.key === 'bought') sounds.playBuy()
        }
      })

      prevLogsLengthRef.current = gameState.logs.length
    }
  }, [gameState.turnPhase, gameState.logs, sounds])

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
        sounds.playMove()
        sendAction({ type: 'MOVE_STEP' })
      }, 300) // 300ms per step hop
      return () => clearTimeout(timer)
    }
  }, [gameState.turnPhase, gameState.stepsLeft, isMyTurn, sendAction, gameState.status, sounds])

  const handleRoll = () => {
    sounds.playClick()
    if (isRollingRef.current) return
    isRollingRef.current = true
    sendAction({ type: 'ROLL' })
    setTimeout(() => {
      isRollingRef.current = false
    }, 2000)
  }

  const handleBuy = () => {
    sounds.playClick()
    sendAction({ type: 'BUY' })
  }
  const handleEndTurn = () => {
    sounds.playClick()
    sendAction({ type: 'END_TURN' })
  }

  const [showMobileLeft, setShowMobileLeft] = useState(false)
  const [showMobileRight, setShowMobileRight] = useState(false)

  const playerInfoContent = (
    <div className="w-64 space-y-4">
      <div className="bg-white/90 dark:bg-slate-900/90 p-4 rounded-lg shadow-md border-l-4 border-egyptian-blue rtl:border-r-4 rtl:border-l-0">
        <h3 className="font-bold flex items-center gap-2 mb-2">
          <Users size={18} /> {t('game.players')}
        </h3>

        <div className="space-y-2">
          {gameState.players.map((p, i) => (
            <div
              key={p.id}
              className={`flex justify-between items-center p-2 rounded min-w-0 ${
                i === gameState.currentPlayerIndex ? 'bg-egyptian-gold/20' : ''
              } ${p.isBankrupt ? 'opacity-50 grayscale' : ''}`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: p.isBankrupt ? '#94a3b8' : p.color }}
                />
                <span className={`truncate ${p.isBankrupt ? 'line-through' : ''}`} title={p.name}>
                  {p.name} {p.id === myId ? t('waiting.you') : ''}
                </span>
              </span>
              <span className="font-bold text-xs shrink-0">
                {p.isBankrupt ? t('game.bankruptLabel') : `${p.balance} ${GAME_CONFIG.CURRENCY}`}
              </span>
            </div>
          ))}
        </div>

        {lobbyId && (
          <div className="space-y-2 mt-4">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded border border-dashed border-slate-400 dark:border-slate-600 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase block">
                {t('game.shareIdLabel')}
              </span>
              <span className="font-mono font-bold select-all">{lobbyId}</span>
            </div>
            <button
              onClick={handleShareLink}
              className="w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 py-2 rounded-lg font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors relative"
            >
              {showCopied ? t('game.copiedBtn') : t('game.shareLinkBtn')}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white/90 dark:bg-slate-900/90 p-4 rounded-lg shadow-md border-l-4 border-egyptian-gold rtl:border-r-4 rtl:border-l-0">
        <h3 className="font-bold flex items-center gap-2 mb-2 uppercase text-sm">
          {t('game.gameLogs')}
        </h3>
        <div className="h-48 overflow-y-auto text-[10px] space-y-1 pr-2 rtl:pr-0 rtl:pl-2">
          {gameState.logs.map((log, i) => {
            if (typeof log === 'string') {
              return (
                <div key={i} className="border-b border-slate-100 dark:border-slate-800 pb-1">
                  {log}
                </div>
              )
            }
            if (log.key) {
              const translatedParams = { ...log.params }
              if (translatedParams.property) {
                const propName = String(translatedParams.property)
                translatedParams.property = t(`tiles.${propName.toLowerCase().replace(/ /g, '-')}`)
              }
              return (
                <div key={i} className="border-b border-slate-100 dark:border-slate-800 pb-1">
                  {t(`logs.${log.key}`, translatedParams) as string}
                </div>
              )
            }
            return (
              <div key={i} className="border-b border-slate-100 dark:border-slate-800 pb-1">
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
    <>
      {/* Mobile Landscape Overlay - only active when on GameScreen */}
      <div className="landscape-overlay">
        <SmartphoneNfc size={64} className="landscape-overlay-icon mb-4" />
        <h2 className="text-2xl font-bold mb-2 font-english-pixel">{t('game.pleaseRotate')}</h2>
        <p className="font-arabic-pixel text-xl">{t('game.rotateInstruction')}</p>
      </div>

      <div className="game-screen-container flex flex-col lg:flex-row gap-4 lg:gap-8 w-full max-w-7xl justify-center items-center lg:items-start relative">
        {/* Mobile Sticky Nav/FABs */}
        <div className="lg:hidden fixed top-4 left-4 right-4 flex justify-between z-30 pointer-events-none">
          <button
            onClick={() => {
              sounds.playClick()
              setShowMobileLeft(true)
            }}
            className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-full shadow-lg border-2 border-egyptian-blue text-egyptian-blue pointer-events-auto"
            aria-label={t('game.infoLogs')}
          >
            <Info size={24} />
          </button>
          <button
            onClick={() => {
              sounds.playClick()
              setShowMobileRight(true)
            }}
            className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-full shadow-lg border-2 border-egyptian-red text-egyptian-red pointer-events-auto"
            aria-label={t('game.controlsChat')}
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
          trades={gameState.trades || []}
          sendAction={sendAction}
        />

        {/* Desktop Left Panel */}
        <div className="hidden lg:block">{playerInfoContent}</div>

        {/* Center: Board - Scrollable wrapper for mobile */}
        <div className="w-full max-w-full overflow-auto flex justify-center pb-4 lg:pb-0 relative z-10 scale-90 sm:scale-100 origin-top">
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={3}
            pinch={{ step: 5 }}
            doubleClick={{ disabled: true }}
            panning={{ disabled: false }}
          >
            <TransformComponent>
              <Board handleRoll={handleRoll} isMyTurn={isMyTurn} sendAction={sendAction} />
            </TransformComponent>
          </TransformWrapper>
        </div>

        {/* Desktop Right Panel */}
        <div className="hidden lg:block">{controlsContent}</div>

        <WinnerModal
          isOpen={gameState.status === 'FINISHED'}
          winner={gameState.players.find((p) => !p.isBankrupt)}
          isHost={isHost}
          onRematch={() => sendAction({ type: 'REMATCH' })}
        />

        {/* Mobile Modals */}
        <AnimatePresence>
          {showMobileLeft && (
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="fixed inset-0 z-50 flex bg-black/50"
            >
              <div className="bg-sand dark:bg-slate-900 p-4 h-full w-80 overflow-y-auto shadow-2xl relative">
                <button
                  onClick={() => {
                    sounds.playClick()
                    setShowMobileLeft(false)
                  }}
                  className="absolute top-4 right-4 rtl:left-4 rtl:right-auto bg-white dark:bg-slate-800 dark:text-white rounded-full p-1"
                >
                  <X size={20} />
                </button>
                <h2 className="text-xl font-bold mb-4 mt-2">{t('game.infoLogs')}</h2>
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
              <div className="bg-sand dark:bg-slate-900 p-4 h-full w-80 overflow-y-auto shadow-2xl relative">
                <button
                  onClick={() => {
                    sounds.playClick()
                    setShowMobileRight(false)
                  }}
                  className="absolute top-4 right-4 rtl:left-4 rtl:right-auto bg-white dark:bg-slate-800 dark:text-white rounded-full p-1 z-50"
                >
                  <X size={20} />
                </button>
                <h2 className="text-xl font-bold mb-4 mt-2">{t('game.controlsChat')}</h2>
                {controlsContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <InformationDialog
        isOpen={!!gameState.activeEvent}
        title={gameState.activeEvent?.title || ''}
        message={gameState.activeEvent?.description || ''}
        onClose={() => sendAction({ type: 'CLEAR_EVENT' })}
      />
    </>
  )
}

export default GameScreen
