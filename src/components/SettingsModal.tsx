import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Settings, Server, Volume2, Music } from 'lucide-react'
import { useGame } from '../context/GameContext'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type Tab = 'general' | 'servers'

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t, i18n } = useTranslation()
  const {
    isSfxEnabled,
    setIsSfxEnabled,
    isBgmEnabled,
    setIsBgmEnabled,
    sfxVolume,
    setSfxVolume,
    bgmVolume,
    setBgmVolume,
  } = useGame()
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )
  const [iceUrl, setIceUrl] = useState('')

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
      return next
    })
  }

  if (!isOpen) return null

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value)
  }

  const handleAddIceCandidate = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement adding ICE candidate logic
    console.log('TODO: Add ICE Candidate:', iceUrl)
    setIceUrl('')
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-e border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col">
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center md:block">
          <h2 className="text-xl md:text-2xl font-bold text-egyptian-blue dark:text-egyptian-gold uppercase tracking-widest flex items-center gap-2">
            <Settings size={24} />
            {t('common.settings.title')}
          </h2>
          {/* Close button inside header on mobile only */}
          <button
            onClick={onClose}
            className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
            aria-label={t('common.settings.close')}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-none md:flex-1 p-2 md:p-4 flex flex-row md:flex-col gap-2 md:gap-0 md:space-y-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 md:flex-none md:w-full flex justify-center md:justify-start items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg font-bold transition-colors whitespace-nowrap ${
              activeTab === 'general'
                ? 'bg-egyptian-blue text-white dark:bg-egyptian-gold dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Settings size={20} />
            {t('common.settings.general')}
          </button>

          <button
            onClick={() => setActiveTab('servers')}
            className={`flex-1 md:flex-none md:w-full flex justify-center md:justify-start items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg font-bold transition-colors whitespace-nowrap ${
              activeTab === 'servers'
                ? 'bg-egyptian-blue text-white dark:bg-egyptian-gold dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Server size={20} />
            {t('common.settings.servers')}
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header with Close Button (desktop only) */}
        <div className="hidden md:flex justify-end p-4">
          <button
            onClick={onClose}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label={t('common.settings.close')}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            {activeTab === 'general' && (
              <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <section className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-lg md:text-xl font-bold text-egyptian-blue dark:text-egyptian-gold mb-4">
                    {t('common.settings.language')}
                  </h3>
                  <div className="flex flex-col gap-2">
                    <select
                      value={i18n.language}
                      onChange={handleLanguageChange}
                      className="w-full md:w-64 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold focus:ring-2 focus:ring-egyptian-blue dark:focus:ring-egyptian-gold focus:border-transparent outline-none"
                    >
                      <option value="en">{t('common.languageToggle.en')}</option>
                      <option value="ar">{t('common.languageToggle.ar')}</option>
                    </select>
                  </div>
                </section>

                <section className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-lg md:text-xl font-bold text-egyptian-blue dark:text-egyptian-gold mb-4">
                    {t('common.settings.displayMode')}
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-600 dark:text-slate-400">
                      {isDarkMode ? t('common.settings.dark') : t('common.settings.light')}
                    </span>
                    <button
                      onClick={toggleDarkMode}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-egyptian-blue focus:ring-offset-2 ${
                        isDarkMode
                          ? 'bg-egyptian-blue dark:bg-egyptian-gold'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                      role="switch"
                      aria-checked={isDarkMode}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          isDarkMode
                            ? 'translate-x-9 rtl:-translate-x-9'
                            : 'translate-x-1 rtl:-translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </section>

                <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-egyptian-blue mb-4">Audio</h3>
                  <div className="flex flex-col gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-bold text-slate-600 flex items-center gap-2">
                          <Volume2 size={20} /> Sound Effects
                        </span>
                        <button
                          onClick={() => setIsSfxEnabled(!isSfxEnabled)}
                          className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-egyptian-blue focus:ring-offset-2 ${
                            isSfxEnabled ? 'bg-egyptian-blue' : 'bg-slate-300'
                          }`}
                          role="switch"
                          aria-checked={isSfxEnabled}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                              isSfxEnabled
                                ? 'translate-x-9 rtl:-translate-x-9'
                                : 'translate-x-1 rtl:-translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 pl-7 rtl:pl-0 rtl:pr-7">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={sfxVolume}
                          onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                          disabled={!isSfxEnabled}
                          className="w-full accent-egyptian-blue disabled:opacity-50"
                        />
                        <span className="text-sm text-slate-500 w-12 text-right">
                          {Math.round(sfxVolume * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-bold text-slate-600 flex items-center gap-2">
                          <Music size={20} /> Background Music
                        </span>
                        <button
                          onClick={() => setIsBgmEnabled(!isBgmEnabled)}
                          className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-egyptian-blue focus:ring-offset-2 ${
                            isBgmEnabled ? 'bg-egyptian-blue' : 'bg-slate-300'
                          }`}
                          role="switch"
                          aria-checked={isBgmEnabled}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                              isBgmEnabled
                                ? 'translate-x-9 rtl:-translate-x-9'
                                : 'translate-x-1 rtl:-translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 pl-7 rtl:pl-0 rtl:pr-7">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={bgmVolume}
                          onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                          disabled={!isBgmEnabled}
                          className="w-full accent-egyptian-blue disabled:opacity-50"
                        />
                        <span className="text-sm text-slate-500 w-12 text-right">
                          {Math.round(bgmVolume * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'servers' && (
              <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <section className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-lg md:text-xl font-bold text-egyptian-blue dark:text-egyptian-gold mb-4">
                    {t('common.settings.addIceCandidate')}
                  </h3>
                  <form
                    onSubmit={handleAddIceCandidate}
                    className="flex flex-col md:flex-row gap-3 md:gap-4"
                  >
                    <input
                      type="text"
                      value={iceUrl}
                      onChange={(e) => setIceUrl(e.target.value)}
                      placeholder={t('common.settings.iceCandidateUrl')}
                      className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono focus:ring-2 focus:ring-egyptian-blue dark:focus:ring-egyptian-gold focus:border-transparent outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!iceUrl.trim()}
                      className="w-full md:w-auto px-6 py-3 bg-egyptian-blue dark:bg-egyptian-gold text-white dark:text-slate-900 font-bold rounded-lg hover:bg-blue-800 dark:hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('common.settings.add')}
                    </button>
                  </form>
                  {/* TODO: Display list of added ICE candidates here */}
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
