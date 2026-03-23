import React, { useState } from 'react'
import { useGame } from '../context/GameContext'
import { useTranslation } from 'react-i18next'
import merchantAvatar from '../assets/avatars/merchant.webp'
import auntAvatar from '../assets/avatars/aunt.webp'
import youthAvatar from '../assets/avatars/youth.webp'
import ceoAvatar from '../assets/avatars/ceo.webp'
import businessAvatar from '../assets/avatars/business.webp'
import projectAvatar from '../assets/avatars/project.webp'

const MAX_NAME_LENGTH = 12
const MIN_NAME_LENGTH = 2

const AVATARS: Record<string, string> = {
  merchant: merchantAvatar,
  aunt: auntAvatar,
  youth: youthAvatar,
  ceo: ceoAvatar,
  business: businessAvatar,
  project: projectAvatar,
}

const AVATAR_NAMES: Record<string, string> = {
  merchant: 'The Clever Merchant',
  aunt: 'The Rich Aunt',
  youth: 'The Trendy Youth',
  ceo: 'The CEO/Founder',
  business: 'The Business Manager',
  project: 'The Project Manager',
}

const isValidName = (name: string): boolean => {
  // Allow Arabic characters, English letters, numbers, and spaces
  const nameRegex = /^[\u0600-\u06FFa-zA-Z0-9\s]+$/
  return nameRegex.test(name)
}

const LoginScreen: React.FC = () => {
  const { t } = useTranslation()
  const { setPlayerName, setAvatarName } = useGame()
  const [name, setName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('merchant')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()

    if (trimmed.length < MIN_NAME_LENGTH) {
      setError(
        t('login.errorTooShort', {
          min: MIN_NAME_LENGTH,
          defaultValue: `Name must be at least ${MIN_NAME_LENGTH} characters`,
        }),
      )
      return
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(t('login.errorTooLong', { max: MAX_NAME_LENGTH }))
      return
    }
    if (!isValidName(trimmed)) {
      setError(t('login.errorInvalidChars', { defaultValue: 'Name contains invalid characters' }))
      return
    }

    setAvatarName(selectedAvatar)
    setPlayerName(trimmed)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, MAX_NAME_LENGTH + 5)
    setName(value)
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/90 dark:bg-slate-900/90 p-8 rounded-xl shadow-xl border-t-4 border-egyptian-gold">
        <h1 className="text-3xl font-bold text-center mb-2 text-egyptian-blue dark:text-egyptian-gold uppercase tracking-widest font-english-pixel">
          {t('login.title')}
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-6">{t('login.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-6">
            <h2 className="text-center font-bold text-slate-700 dark:text-slate-300 mb-3">
              {t('login.selectAvatar')}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(AVATARS).map(([key, path]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedAvatar(key)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-4 transition-all ${
                    selectedAvatar === key
                      ? 'border-egyptian-gold scale-105 shadow-lg'
                      : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                  title={AVATAR_NAMES[key]}
                >
                  <img src={path} alt={AVATAR_NAMES[key]} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <p className="text-center text-sm mt-2 text-egyptian-blue dark:text-egyptian-gold font-bold">
              {AVATAR_NAMES[selectedAvatar]}
            </p>
          </div>

          <div>
            <input
              type="text"
              value={name}
              onChange={handleChange}
              placeholder={t('login.namePlaceholder')}
              className={`w-full border border-2 p-3 rounded-lg outline-none transition-colors bg-white dark:bg-slate-800 dark:text-white ${
                error
                  ? 'border-red-500 focus:border-red-600 dark:border-red-400 dark:focus:border-red-500'
                  : 'border-slate-200 focus:border-egyptian-blue dark:border-slate-700 dark:focus:border-egyptian-gold'
              }`}
              autoFocus
              required
              maxLength={MAX_NAME_LENGTH + 5}
              aria-describedby={error ? 'name-error' : undefined}
            />
            {error && (
              <p
                id="name-error"
                className="text-red-500 dark:text-red-400 text-xs mt-1"
                role="alert"
              >
                {error}
              </p>
            )}
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
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
