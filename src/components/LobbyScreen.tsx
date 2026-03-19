import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface LobbyScreenProps {
  createLobby: () => void
  joinLobby: (id: string) => void
}

export default function LobbyScreen({ createLobby, joinLobby }: LobbyScreenProps) {
  const { t } = useTranslation()
  const [joinId, setJoinId] = useState('')
  const [joinError, setJoinError] = useState('')

  const handleJoinLobby = () => {
    const sanitizedId = joinId.trim().replace(/[<>&"'`]/g, '')
    if (!sanitizedId) {
      setJoinError(t('lobby.errorEmpty'))
      return
    }
    setJoinError('')
    joinLobby(sanitizedId)
  }

  return (
    <div className="max-w-md w-full bg-white/90 dark:bg-slate-900/90 p-8 rounded-xl shadow-xl border-t-4 border-egyptian-gold mt-20">
      <h1 className="text-3xl font-bold text-center mb-6 text-egyptian-blue dark:text-egyptian-gold uppercase tracking-widest">
        {t('lobby.title')}
      </h1>

      <div className="space-y-4">
        <button
          onClick={createLobby}
          className="w-full bg-egyptian-gold text-white dark:text-slate-900 py-3 rounded-lg font-bold hover:bg-yellow-600 transition-colors"
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
            className="bg-egyptian-blue text-white px-4 py-2 rounded-lg font-bold"
          >
            {t('lobby.joinBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
