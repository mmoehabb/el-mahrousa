import React, { useState } from 'react'
import { useGame } from '../context/GameContext'
import { useTranslation } from 'react-i18next'

const LoginScreen: React.FC = () => {
  const { t } = useTranslation()
  const { setPlayerName } = useGame()
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      setPlayerName(name.trim())
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/90 p-8 rounded-xl shadow-xl border-t-4 border-egyptian-gold">
        <h1 className="text-3xl font-bold text-center mb-2 text-egyptian-blue uppercase tracking-widest">
          El-Mahrousa
        </h1>
        <p className="text-center text-slate-500 mb-6">{t('login.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('login.namePlaceholder')}
              className="w-full border-2 border-slate-200 p-3 rounded-lg focus:border-egyptian-blue outline-none transition-colors"
              autoFocus
              required
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-egyptian-blue text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            PLAY AS GUEST
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginScreen
