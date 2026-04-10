import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dice5, Send, Handshake, Flag, Mic, MicOff, PhoneCall, Save, Upload } from 'lucide-react'
import type { Player, GameState, GameAction } from '../types/game'
import { useGameSounds } from '../hooks/useGameSounds'
import { useGame } from '../context/GameContext'
import ConfirmDialog from './ConfirmDialog'
import Toast from './Toast'

const MAX_CHAT_LENGTH = 200

const sanitizeMessage = (msg: string): string => {
  return msg.slice(0, MAX_CHAT_LENGTH).replace(/[<>&"'`]/g, '')
}

interface GameControlsProps {
  gameState: GameState
  isMyTurn: boolean
  handleRoll: () => void
  handleBuy: () => void
  handleEndTurn: () => void
  setIsTradeOpen: (open: boolean) => void
  sendAction: (action: GameAction) => void
  toggleVoiceChat?: () => void
  isMuted?: boolean
  hasJoinedVoice?: boolean
  isHost?: boolean
}

export default function GameControls({
  gameState,
  isMyTurn,
  handleRoll,
  handleBuy,
  handleEndTurn,
  setIsTradeOpen,
  sendAction,
  toggleVoiceChat,
  isMuted,
  hasJoinedVoice,
  isHost,
}: GameControlsProps) {
  const { t } = useTranslation()
  const { myId } = useGame()
  const [chatMsg, setChatMsg] = useState('')
  const sounds = useGameSounds()
  const [isBankruptDialogOpen, setIsBankruptDialogOpen] = useState(false)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const me = gameState.players.find((p) => p.id === myId)

  const { ownerByTile } = useMemo(() => {
    const ownerMap: Record<number, Player> = {}

    gameState.players.forEach((p) => {
      p.properties.forEach((propId) => {
        ownerMap[propId] = p
      })
    })

    return { ownerByTile: ownerMap }
  }, [gameState.players])

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    const sanitized = sanitizeMessage(chatMsg)
    if (!sanitized.trim()) return
    sendAction({ type: 'CHAT', message: sanitized })
    setChatMsg('')
  }

  const handleEndTurnClick = () => {
    if (currentPlayer && currentPlayer.balance < 0) {
      setToastMessage(t('game.mustPayDebts'))
      sounds.playBankrupt()
    } else {
      handleEndTurn()
    }
  }

  const handleSaveGame = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(gameState))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute('href', dataStr)
    downloadAnchorNode.setAttribute('download', 'monopoly_save.json')
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const handleLoadGame = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const loadedState = JSON.parse(e.target?.result as string)
        if (
          loadedState &&
          loadedState.players &&
          loadedState.players.length === gameState.players.length
        ) {
          // Mapping existing IDs, names, avatars to the loaded state
          loadedState.players = loadedState.players.map((p: Player, index: number) => ({
            ...p,
            id: gameState.players[index].id,
            name: gameState.players[index].name,
            avatar: gameState.players[index].avatar,
            isDisconnected: gameState.players[index].isDisconnected,
          }))
          sendAction({ type: 'LOAD_GAME', state: loadedState })
          setToastMessage('Game loaded successfully!')
        } else {
          setToastMessage('Cannot load game: Number of players does not match.')
        }
      } catch {
        setToastMessage('Error parsing save file.')
      }
    }
    reader.readAsText(file)
    // clear input
    event.target.value = ''
  }

  const myPendingTrades = (gameState.trades || []).filter(
    (trade) => (trade.fromId === myId || trade.toId === myId) && trade.status === 'PENDING',
  )

  return (
    <div className="w-full lg:w-64 space-y-4">
      <div className="bg-white/90 dark:bg-slate-900/90 p-6 rounded-lg shadow-md border-r-4 border-egyptian-red text-center rtl:border-l-4 rtl:border-r-0">
        <div className="mb-4">
          <span className="fs-xs text-slate-500 dark:text-slate-400 uppercase">
            {t('game.currentTurnLabel')}
          </span>
          <div className="font-bold fs-lg">{currentPlayer?.name || t('game.waitingTurn')}</div>
          {gameState.status === 'PLAYING' && typeof gameState.turnTimer === 'number' && (
            <div className="text-red-500 font-bold mt-1 text-sm">⏳ {gameState.turnTimer}s</div>
          )}
        </div>

        <div className="relative">
          {isMyTurn && gameState.turnPhase === 'ROLL' && (
            <button
              onClick={handleRoll}
              className="w-full fs-lg bg-egyptian-blue text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 fs-2xs"
            >
              <Dice5 /> {t('game.rollDiceBtn')}
            </button>
          )}

          {isMyTurn && gameState.turnPhase === 'ACTION' && (
            <div className="space-y-2">
              {gameState.tiles[currentPlayer.position]?.price &&
                !ownerByTile[currentPlayer.position] && (
                  <button
                    onClick={handleBuy}
                    disabled={
                      currentPlayer.balance < (gameState.tiles[currentPlayer.position].price || 0)
                    }
                    className="w-full fs-lg bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:!bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed fs-2xs"
                  >
                    {t('game.buyForBtn', {
                      price: gameState.tiles[currentPlayer.position].price,
                    })}
                  </button>
                )}
              <button
                onClick={handleEndTurnClick}
                className="w-full fs-lg bg-slate-500 text-white py-2 rounded-lg font-bold hover:bg-slate-600 fs-2xs"
              >
                {t('game.skipEndTurnBtn')}
              </button>
            </div>
          )}

          {isMyTurn && gameState.turnPhase === 'END' && (
            <button
              onClick={handleEndTurnClick}
              className="w-full fs-lg bg-egyptian-blue text-white py-2 rounded-lg font-bold fs-2xs"
            >
              {t('game.endTurnBtn')}
            </button>
          )}

          <button
            onClick={() => {
              sounds.playClick()
              setIsLeaveDialogOpen(true)
            }}
            className="w-full fs-lg bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition-all mt-4 fs-2xs"
          >
            {t('game.leaveGameBtn')}
          </button>

          {me && !me.isBankrupt && (
            <button
              onClick={() => setIsBankruptDialogOpen(true)}
              className="w-full fs-lg border-2 border-red-600 text-red-600 py-2 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-all mt-4 flex items-center justify-center gap-2 fs-2xs"
              title={t('game.declareBankrupt')}
            >
              <Flag size={14} /> {t('game.bankruptBtn')}
            </button>
          )}

          {isHost && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSaveGame}
                className="flex-1 fs-lg border-2 border-slate-600 text-slate-600 dark:border-slate-400 dark:text-slate-400 py-2 rounded-lg font-bold hover:bg-slate-600 hover:text-white dark:hover:bg-slate-400 dark:hover:text-slate-900 transition-all flex items-center justify-center gap-1 fs-2xs"
                title="Save Game"
              >
                <Save size={14} /> Save
              </button>
              <label className="flex-1 fs-lg border-2 border-slate-600 text-slate-600 dark:border-slate-400 dark:text-slate-400 py-2 rounded-lg font-bold hover:bg-slate-600 hover:text-white dark:hover:bg-slate-400 dark:hover:text-slate-900 transition-all flex items-center justify-center gap-1 fs-2xs cursor-pointer">
                <Upload size={14} /> Load
                <input type="file" accept=".json" onChange={handleLoadGame} className="hidden" />
              </label>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isBankruptDialogOpen}
        message={t('game.confirmBankrupt')}
        onConfirm={() => sendAction({ type: 'BANKRUPT' })}
        onCancel={() => setIsBankruptDialogOpen(false)}
      />

      <ConfirmDialog
        isOpen={isLeaveDialogOpen}
        message={t('game.confirmLeave')}
        onConfirm={() => (window.location.href = import.meta.env.BASE_URL || '/')}
        onCancel={() => setIsLeaveDialogOpen(false)}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      <div className="bg-white/90 dark:bg-slate-900/90 p-4 rounded-lg shadow-md border-r-4 border-egyptian-gold rtl:border-l-4 rtl:border-r-0">
        <h3 className="font-bold flex items-center gap-2 mb-2 uppercase fs-sm">
          <Handshake size={18} /> {t('trade.tradesBtn')}
        </h3>

        <button
          onClick={() => {
            sounds.playClick()
            setIsTradeOpen(true)
          }}
          className="w-full fs-lg bg-egyptian-gold text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-yellow-600 transition-all fs-2xs mb-3"
        >
          {t('trade.proposeTradeBtn')}
        </button>

        {myPendingTrades.length > 0 && (
          <div className="space-y-2 mb-3">
            {myPendingTrades.slice(0, 3).map((trade) => {
              const isSender = trade.fromId === myId
              const otherId = isSender ? trade.toId : trade.fromId
              const otherPlayer = gameState.players.find((p) => p.id === otherId)
              const otherName = otherPlayer ? otherPlayer.name : 'Unknown'

              return (
                <div
                  key={trade.id}
                  className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 fs-xs flex flex-col gap-2"
                >
                  <div>
                    <span className="font-bold">{isSender ? 'To: ' : 'From: '}</span>
                    {otherName}
                  </div>

                  <div className="flex justify-between gap-1 mt-1">
                    {isSender ? (
                      <button
                        onClick={() => {
                          sounds.playClick()
                          sendAction({ type: 'CANCEL_TRADE', tradeId: trade.id! })
                        }}
                        className="flex-1 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 text-slate-800 dark:text-white py-1 rounded fs-2xs font-bold"
                      >
                        {t('trade.cancel')}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            sounds.playClick()
                            sendAction({ type: 'ACCEPT_TRADE', tradeId: trade.id! })
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1 rounded fs-2xs font-bold"
                        >
                          {t('trade.acceptOffer')}
                        </button>
                        <button
                          onClick={() => {
                            sounds.playClick()
                            sendAction({ type: 'REJECT_TRADE', tradeId: trade.id! })
                          }}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1 rounded fs-2xs font-bold"
                        >
                          {t('trade.reject')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <button
          onClick={() => {
            sounds.playClick()
            setIsTradeOpen(true)
          }}
          className="w-full fs-lg text-center text-egyptian-gold hover:underline fs-xs"
        >
          {t('trade.viewAllTrades')}
        </button>
      </div>

      <div className="bg-white/90 dark:bg-slate-900/90 p-4 rounded-lg shadow-md border-r-4 border-slate-400 dark:border-slate-600 rtl:border-l-4 rtl:border-r-0">
        <div className="h-40 flex flex-col">
          <div className="flex-1 overflow-y-auto fs-xs space-y-2 mb-2 pr-1 rtl:pr-0 rtl:pl-1">
            {gameState.chatMessages.length === 0 ? (
              <div className="text-slate-400 dark:text-slate-500 italic">{t('game.chatReady')}</div>
            ) : (
              gameState.chatMessages.map((msg, i) => (
                <div key={i} className="mb-1">
                  <span className="font-bold text-egyptian-blue">{msg.sender}: </span>
                  <span>{msg.message}</span>
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={(e) => {
              sounds.playClick()
              handleSendChat(e)
            }}
            className="flex gap-1"
          >
            <input
              type="text"
              className="flex-1 fs-sm min-w-0 border fs-xs p-1 rounded"
              placeholder={t('game.chatPlaceholder')}
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
            />
            <button
              type="submit"
              className="p-2 bg-slate-200 dark:bg-slate-700 rounded rtl:rotate-180 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              title={t('game.sendChat', 'Send')}
            >
              <Send size={14} />
            </button>
            {hasJoinedVoice ? (
              <button
                type="button"
                onClick={toggleVoiceChat}
                className={`p-2 rounded transition-colors ${
                  isMuted
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-600'
                    : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                }`}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleVoiceChat}
                className="p-2 rounded bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 transition-colors"
                title="Connect to Voice Chat"
              >
                <PhoneCall size={14} />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
