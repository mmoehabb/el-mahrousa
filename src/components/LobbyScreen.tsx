import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { useAdBreak } from '../hooks/useAdBreak'

interface LobbyScreenProps {
  createLobby: () => void
  joinLobby: (id: string) => void
}

export default function LobbyScreen({ createLobby, joinLobby }: LobbyScreenProps) {
  const { t } = useTranslation()
  const { showInterstitialAd } = useAdBreak()
  const [joinId, setJoinId] = useState('')
  const [joinError, setJoinError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  const handleCreateLobby = () => {
    setIsCreating(true)
    showInterstitialAd(() => {
      setIsCreating(false)
      createLobby()
    })
  }

  const handleJoinLobby = () => {
    const sanitizedId = joinId.trim().replace(/[<>&"'`]/g, '')
    if (!sanitizedId) {
      setJoinError(t('lobby.errorEmpty'))
      return
    }
    setJoinError('')
    setIsJoining(true)
    showInterstitialAd(() => {
      setIsJoining(false)
      joinLobby(sanitizedId)
    })
  }

  return (
    <div className="max-w-md w-full bg-white/90 dark:bg-slate-900/90 p-8 rounded-xl shadow-xl border-t-4 border-egyptian-gold mt-20">
      <h1 className="text-3xl font-bold text-center mb-6 text-egyptian-blue dark:text-egyptian-gold uppercase tracking-widest">
        {t('lobby.title')}
      </h1>

      <div className="space-y-4">
        <button
          onClick={handleCreateLobby}
          disabled={isCreating || isJoining}
          className="flex items-center justify-center gap-2 w-full bg-egyptian-gold text-white dark:text-slate-900 py-3 rounded-lg font-bold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating && <Loader2 className="w-5 h-5 animate-spin" />}
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
              className={`w-full border p-2 rounded-lg bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 ${joinError ? 'border-red-500 dark:border-red-400' : ''}`}
              aria-describedby={joinError ? 'join-error' : undefined}
            />
            {joinError && (
              <p
                id="join-error"
                className="text-red-500 dark:text-red-400 text-xs mt-1"
                role="alert"
              >
                {joinError}
              </p>
            )}
          </div>
          <button
            onClick={handleJoinLobby}
            disabled={isCreating || isJoining}
            className="flex items-center justify-center gap-2 bg-egyptian-blue text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining && <Loader2 className="w-5 h-5 animate-spin" />}
            {t('lobby.joinBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
