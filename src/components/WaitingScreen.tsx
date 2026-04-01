import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Users, UserMinus, Mic, MicOff, PhoneCall, Bot } from 'lucide-react'
import type { GameState } from '../types/game'
import ConfirmDialog from './ConfirmDialog'

interface WaitingScreenProps {
  gameState: GameState
  myId: string
  isHost: boolean
  lobbyId: string
  showCopied: boolean
  handleShareLink: () => void
  sendAction: (action: { type: string; [key: string]: unknown }) => void
  toggleVoiceChat?: () => void
  isMuted?: boolean
  voiceError?: string | null
  setVoiceError?: (err: string | null) => void
  hasJoinedVoice?: boolean
}

export default function WaitingScreen({
  gameState,
  myId,
  isHost,
  lobbyId,
  showCopied,
  handleShareLink,
  sendAction,
  toggleVoiceChat,
  isMuted,
  hasJoinedVoice,
}: WaitingScreenProps) {
  const { t } = useTranslation()
  const [playerToKick, setPlayerToKick] = useState<string | null>(null)

  return (
    <div className="max-w-md w-full bg-white/90 dark:bg-slate-900/90 p-8 rounded-xl shadow-xl border-t-4 border-egyptian-gold mt-20 relative">
      <ConfirmDialog
        isOpen={!!playerToKick}
        message={t('game.confirmKick', 'Are you sure you want to kick this player?')}
        onConfirm={() => {
          if (playerToKick) {
            sendAction({ type: 'KICK_PLAYER', playerId: playerToKick })
            setPlayerToKick(null)
          }
        }}
        onCancel={() => setPlayerToKick(null)}
      />
      <h1 className="text-3xl font-bold text-center mb-6 text-egyptian-blue dark:text-egyptian-gold uppercase tracking-widest">
        {t('waiting.title')}
      </h1>

      <div className="space-y-6">
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-dashed border-slate-400 dark:border-slate-500 text-center">
          <span className="text-sm text-slate-500 dark:text-slate-400 uppercase block mb-1">
            {t('waiting.lobbyIdLabel')}
          </span>
          <span
            className="font-mono text-xl font-bold select-all block mb-2 truncate dark:text-white"
            title={lobbyId}
          >
            {lobbyId}
          </span>
          <button
            onClick={handleShareLink}
            className="w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 py-2 rounded-lg font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            {showCopied ? t('game.copiedBtn') : t('game.shareLinkBtn')}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold flex items-center gap-2 mb-3 text-egyptian-blue dark:text-egyptian-gold">
            <Users size={18} /> {t('waiting.playersCount', { count: gameState.players.length })}
          </h3>
          <div className="space-y-2">
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700 rounded"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <span className="font-semibold truncate dark:text-white" title={p.name}>
                  {p.name} {p.id === myId ? t('waiting.you') : ''}
                </span>
                {p.id === gameState.players[0].id && (
                  <span className="text-xs bg-egyptian-gold text-white px-2 py-0.5 rounded ltr:ml-auto rtl:mr-auto">
                    {t('waiting.host')}
                  </span>
                )}
                {p.isBot && (
                  <span className="text-xs bg-slate-500 text-white px-2 py-0.5 rounded ltr:ml-auto rtl:mr-auto flex items-center gap-1">
                    <Bot size={12} /> {t('waiting.bot', 'Bot')}
                  </span>
                )}
                <div className="ml-auto rtl:mr-auto rtl:ml-0 flex items-center gap-2">
                  {p.id === myId ? (
                    hasJoinedVoice ? (
                      <button
                        onClick={toggleVoiceChat}
                        className={`p-1.5 rounded-full transition-colors ${
                          isMuted
                            ? 'bg-slate-200 dark:bg-slate-600 text-slate-500 hover:bg-slate-300'
                            : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                        }`}
                        title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                      >
                        {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                    ) : (
                      <button
                        onClick={toggleVoiceChat}
                        className="p-1.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 transition-colors"
                        title="Connect to Voice Chat"
                      >
                        <PhoneCall size={16} />
                      </button>
                    )
                  ) : (
                    p.hasJoinedVoice && (
                      <div
                        className="p-1.5 text-slate-400"
                        title={p.isMuted === false ? 'Speaking' : 'Muted'}
                      >
                        {p.isMuted === false ? (
                          <Mic size={16} className="text-green-500" />
                        ) : (
                          <MicOff size={16} />
                        )}
                      </div>
                    )
                  )}

                  {isHost && p.id !== myId && (
                    <button
                      onClick={() => setPlayerToKick(p.id)}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors ml-1"
                      title={t('game.kickPlayer', 'Kick Player')}
                    >
                      <UserMinus size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
          {isHost ? (
            gameState.countdown === null ? (
              <div className="space-y-3">
                <button
                  onClick={() => sendAction({ type: 'ADD_BOT' })}
                  className="w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  <Bot size={18} /> {t('waiting.addBotBtn', 'Add Bot')}
                </button>
                <button
                  onClick={() => sendAction({ type: 'START_COUNTDOWN' })}
                  className="w-full bg-egyptian-blue text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors text-lg"
                >
                  {t('waiting.startGameBtn')}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-2xl font-black text-egyptian-red animate-pulse">
                  {t('waiting.startingIn', { count: gameState.countdown })}
                </div>
                <button
                  onClick={() => sendAction({ type: 'CANCEL_COUNTDOWN' })}
                  className="w-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-lg font-bold hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors"
                >
                  {t('waiting.cancelBtn')}
                </button>
              </div>
            )
          ) : (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg font-semibold animate-pulse">
              {gameState.countdown !== null
                ? t('waiting.startingIn', { count: gameState.countdown })
                : t('waiting.waitingForHost')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
