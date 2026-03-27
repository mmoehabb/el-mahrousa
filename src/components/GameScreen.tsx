import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  Info,
  Settings2,
  X,
  UserMinus,
  Mic,
  MicOff,
  Menu,
  Gamepad2,
  Camera,
} from 'lucide-react'
import { useGame } from '../context/GameContext'
import Board from './Board'
import PropertyModal from './PropertyModal'
import TradeModal from './TradeModal'
import GameControls from './GameControls'
import WinnerModal from './WinnerModal'
import InformationDialog from './InformationDialog'
import type { GameAction, Tile } from '../types/game'
import { GAME_CONFIG } from '../config/gameConfig'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameSounds } from '../hooks/useGameSounds'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'

interface GameScreenProps {
  lobbyId: string | null
  sendAction: (action: GameAction) => void
  showCopied: boolean
  handleShareLink: () => void
  toggleVoiceChat?: () => void
  isMuted?: boolean
  voiceError?: string | null
  setVoiceError?: (err: string | null) => void
  hasJoinedVoice?: boolean
}

const GameScreen: React.FC<GameScreenProps> = ({
  lobbyId,
  sendAction,
  showCopied,
  handleShareLink,
  toggleVoiceChat,
  isMuted,
  hasJoinedVoice,
}) => {
  const { t } = useTranslation()
  const { gameState, myId, isHost } = useGame()
  const [isTradeOpen, setIsTradeOpen] = useState(false)
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null)
  const isRollingRef = useRef(false)
  const sounds = useGameSounds()
  const prevPhaseRef = useRef(gameState.turnPhase)
  const prevLogsLengthRef = useRef(gameState.logs.length)
  const prevActiveEventRef = useRef(gameState.activeEvent)
  const transformComponentRef = useRef<ReactZoomPanPinchRef | null>(null)

  const [isFollowCameraOn, setIsFollowCameraOn] = useState(true)

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
          if (log.includes('was sent to Prison')) sounds.playJail()
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

  // Handle camera follow logic
  useEffect(() => {
    if (isFollowCameraOn && currentPlayer) {
      const tileId = `tile-${currentPlayer.position}`
      if (transformComponentRef.current) {
        const scale = transformComponentRef.current.instance.transformState.scale
        transformComponentRef.current.zoomToElement(tileId, scale, 500, 'easeInOutQuad')
      }
    }
  }, [currentPlayer?.position, isFollowCameraOn])

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
  const [showDesktopLeft, setShowDesktopLeft] = useState(false)
  const [showDesktopRight, setShowDesktopRight] = useState(false)

  const playerInfoContent = (
    <div className="w-full lg:w-64 space-y-4">
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
              <div className="flex items-center gap-2">
                {!p.isBankrupt && p.id !== myId && p.hasJoinedVoice && (
                  <div className="text-slate-400">
                    {p.isMuted === false ? (
                      <Mic size={14} className="text-green-500" />
                    ) : (
                      <MicOff size={14} />
                    )}
                  </div>
                )}
                <span className="font-bold text-xs shrink-0">
                  {p.isBankrupt ? t('game.bankruptLabel') : `${p.balance} ${GAME_CONFIG.CURRENCY}`}
                </span>
                {isHost && p.id !== myId && !p.isBankrupt && (
                  <button
                    onClick={() => sendAction({ type: 'KICK_PLAYER', playerId: p.id })}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 p-1 rounded transition-colors"
                    title={t('game.kickPlayer', 'Kick Player')}
                  >
                    <UserMinus size={14} />
                  </button>
                )}
              </div>
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
      toggleVoiceChat={toggleVoiceChat}
      isMuted={isMuted}
      hasJoinedVoice={hasJoinedVoice}
    />
  )

  return (
    <>
      <div className="game-screen-container flex flex-col w-full max-w-full justify-start items-center relative pb-16 lg:pb-0 fixed inset-0 h-screen w-screen overflow-hidden">
        <PropertyModal
          isOpen={!!selectedTile}
          onClose={() => setSelectedTile(null)}
          tile={selectedTile}
          owner={
            selectedTile
              ? gameState.players.find((p) => p.properties.includes(selectedTile.id))
              : undefined
          }
          isMyTurn={isMyTurn}
          myId={myId}
          myBalance={gameState.players.find((p) => p.id === myId)?.balance || 0}
          turnPhase={gameState.turnPhase}
          sendAction={sendAction}
        />
        {/* Mobile Bottom Navigation Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-800 p-2 flex justify-around items-center z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => {
              sounds.playClick()
              setShowMobileLeft(true)
            }}
            className="flex flex-col items-center gap-1 text-egyptian-blue dark:text-blue-400 p-2 rounded-lg active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
            aria-label={t('game.infoLogs')}
          >
            <Info size={24} />
            <span className="text-[10px] font-bold">{t('game.infoLogs', 'Info/Logs')}</span>
          </button>
          <button
            onClick={() => {
              sounds.playClick()
              setShowMobileRight(true)
            }}
            className="flex flex-col items-center gap-1 text-egyptian-gold dark:text-yellow-500 p-2 rounded-lg active:bg-slate-100 dark:active:bg-slate-800 transition-colors relative"
            aria-label={t('game.controls', 'Controls')}
          >
            <Gamepad2 size={24} />
            <span className="text-[10px] font-bold">{t('game.controls', 'Controls')}</span>
            {isMyTurn && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900"></span>
            )}
          </button>
          <button
            onClick={() => {
              sounds.playClick()
              const settingsBtn = document.getElementById('global-settings-btn')
              if (settingsBtn) {
                settingsBtn.click()
              }
            }}
            className="flex flex-col items-center gap-1 text-egyptian-blue dark:text-blue-400 p-2 rounded-lg active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
            aria-label={t('common.settings.title', 'Settings')}
          >
            <Settings2 size={24} />
            <span className="text-[10px] font-bold">{t('common.settings.title', 'Settings')}</span>
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

        {/* Desktop Left Panel Toggle Button */}
        <div className="hidden lg:block fixed top-4 left-4 z-40">
          <AnimatePresence>
            {!showDesktopLeft && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => {
                  sounds.playClick()
                  setShowDesktopLeft(true)
                }}
                className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-full shadow-lg border-2 border-egyptian-blue text-egyptian-blue dark:text-blue-400 hover:scale-110 transition-transform"
                title={t('game.infoLogs')}
              >
                <Menu size={24} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Left Panel Overlay */}
        <AnimatePresence>
          {showDesktopLeft && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="hidden lg:block fixed top-4 left-4 z-50 shadow-2xl rounded-lg overflow-hidden max-h-[calc(100vh-2rem)] overflow-y-auto"
            >
              <div className="bg-sand dark:bg-slate-900 w-72">
                <div className="flex justify-between items-center p-3 border-b border-slate-200 dark:border-slate-800 bg-sand dark:bg-slate-900 sticky top-0 z-10">
                  <h2 className="font-bold flex items-center gap-2">
                    <Info size={18} /> {t('game.infoLogs')}
                  </h2>
                  <button
                    onClick={() => {
                      sounds.playClick()
                      setShowDesktopLeft(false)
                    }}
                    className="hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full p-1 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-3">{playerInfoContent}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Right Panel Toggle Button */}
        <div className="hidden lg:block fixed top-4 right-4 z-40">
          <AnimatePresence>
            {!showDesktopRight && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => {
                  sounds.playClick()
                  setShowDesktopRight(true)
                }}
                className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-full shadow-lg border-2 border-egyptian-gold text-egyptian-gold dark:text-yellow-500 hover:scale-110 transition-transform"
                title={t('game.controls', 'Controls')}
              >
                <Gamepad2 size={24} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Right Panel Overlay */}
        <AnimatePresence>
          {showDesktopRight && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="hidden lg:block fixed top-4 right-4 z-50 shadow-2xl rounded-lg overflow-hidden max-h-[calc(100vh-2rem)] overflow-y-auto"
            >
              <div className="bg-sand dark:bg-slate-900 w-80">
                <div className="flex justify-between items-center p-3 border-b border-slate-200 dark:border-slate-800 bg-sand dark:bg-slate-900 sticky top-0 z-10">
                  <h2 className="font-bold flex items-center gap-2">
                    <Gamepad2 size={18} /> {t('game.controls', 'Controls')}
                  </h2>
                  <button
                    onClick={() => {
                      sounds.playClick()
                      setShowDesktopRight(false)
                    }}
                    className="hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full p-1 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-3 flex justify-center">{controlsContent}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center: Board */}
        <div
          dir="ltr"
          className="w-full h-full flex-1 max-w-full overflow-hidden flex justify-center relative z-10 sm:scale-100 origin-top"
        >
          {/* Top-Middle Floating Button for Camera Follow */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
            <button
              onClick={() => setIsFollowCameraOn(!isFollowCameraOn)}
              className={`p-2 rounded-full shadow-lg border-2 transition-colors ${
                isFollowCameraOn
                  ? 'bg-egyptian-blue text-white border-egyptian-blue'
                  : 'bg-white/90 text-slate-500 border-slate-300 dark:bg-slate-800/90 dark:text-slate-400 dark:border-slate-600'
              }`}
              title={isFollowCameraOn ? 'Follow Camera: ON' : 'Follow Camera: OFF'}
            >
              <Camera size={20} />
            </button>
          </div>

          <TransformWrapper
            ref={transformComponentRef}
            initialScale={0.7}
            minScale={0.2}
            maxScale={3}
            pinch={{ step: 5 }}
            doubleClick={{ disabled: true }}
            panning={{ disabled: false }}
            limitToBounds={false}
            centerOnInit={true}
            onPanning={() => setIsFollowCameraOn(false)}
            onWheel={() => setIsFollowCameraOn(false)}
          >
            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
              <Board
                handleRoll={handleRoll}
                isMyTurn={isMyTurn}
                sendAction={sendAction}
                onTileClick={setSelectedTile}
              />
            </TransformComponent>
          </TransformWrapper>
        </div>

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
              className="fixed inset-0 z-50 flex bg-black/50 lg:hidden"
            >
              <div className="bg-sand dark:bg-slate-900 h-full w-80 shadow-2xl flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 bg-sand dark:bg-slate-900 z-10">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Info size={20} /> {t('game.infoLogs')}
                  </h2>
                  <button
                    onClick={() => {
                      sounds.playClick()
                      setShowMobileLeft(false)
                    }}
                    className="hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full p-1 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">{playerInfoContent}</div>
              </div>
            </motion.div>
          )}
          {showMobileRight && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed inset-0 z-50 flex justify-end bg-black/50 lg:hidden"
            >
              <div className="bg-sand dark:bg-slate-900 h-full w-80 shadow-2xl flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 bg-sand dark:bg-slate-900 z-10">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Gamepad2 size={20} /> {t('game.controls', 'Controls')}
                  </h2>
                  <button
                    onClick={() => {
                      sounds.playClick()
                      setShowMobileRight(false)
                    }}
                    className="hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full p-1 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex justify-center">
                  {controlsContent}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <InformationDialog
        isOpen={!!gameState.activeEvent && gameState.activeEvent.playerId === myId}
        title={gameState.activeEvent?.title || ''}
        message={gameState.activeEvent?.description || ''}
        onClose={() => sendAction({ type: 'CLEAR_EVENT' })}
      />
    </>
  )
}

export default GameScreen
