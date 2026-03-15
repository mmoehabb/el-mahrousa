import React, { useState } from 'react'
import { useGame } from '../context/GameContext'
import { useTranslation } from 'react-i18next'

const MAX_NAME_LENGTH = 20

const sanitizeName = (name: string): string => {
  return name.replace(/[<>&"'`]/g, '').trim()
}

const LoginScreen: React.FC = () => {
  const { t } = useTranslation()
  const { setPlayerName } = useGame()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const sanitized = sanitizeName(name)
    if (!sanitized) {
      setError(t('login.errorInvalid'))
      return
    }
    if (sanitized.length > MAX_NAME_LENGTH) {
      setError(t('login.errorTooLong', { max: MAX_NAME_LENGTH }))
      return
    }
    setPlayerName(sanitized)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, MAX_NAME_LENGTH + 5)
    setName(value)
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/90 p-8 rounded-xl shadow-xl border-t-4 border-egyptian-gold">
        <h1 className="text-3xl font-bold text-center mb-2 text-egyptian-blue uppercase tracking-widest font-english-pixel">
          {t('login.title')}
        </h1>
        <p className="text-center text-slate-500 mb-6">{t('login.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={name}
              onChange={handleChange}
              placeholder={t('login.namePlaceholder')}
              className={`w-full border border-2 p-3 rounded-lg outline-none transition-colors ${
                error
                  ? 'border-red-500 focus:border-red-600'
                  : 'border-slate-200 focus:border-egyptian-blue'
              }`}
              autoFocus
              required
              maxLength={MAX_NAME_LENGTH + 5}
              aria-describedby={error ? 'name-error' : undefined}
            />
            {error && (
              <p id="name-error" className="text-red-500 text-xs mt-1" role="alert">
                {error}
              </p>
            )}
            <p className="text-slate-400 text-xs mt-1">
              {t('login.charCount', { current: name.length, max: MAX_NAME_LENGTH })}
            </p>
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-egyptian-blue text-white py-3 rounded-lg font-bold hover:bg-blue-800 active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none"
          >
            {t('login.playGuestBtn')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginScreen
