import React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertOctagon, RefreshCw } from 'lucide-react'

const AdBlockScreen: React.FC = () => {
  const { t } = useTranslation()

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-red-600 flex flex-col items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center border-t-8 border-red-800">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
            <AlertOctagon size={80} className="text-red-600 dark:text-red-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-red-700 dark:text-red-500 mb-4 uppercase tracking-widest">
          {t('adblock.title', 'AdBlocker Detected')}
        </h1>

        <p className="text-slate-700 dark:text-slate-300 text-lg mb-8 leading-relaxed">
          {t(
            'adblock.message',
            'We noticed you are using an ad blocker. Please disable it to play the game, then refresh the page.',
          )}
        </p>

        <button
          onClick={handleRefresh}
          className="flex items-center justify-center w-full gap-3 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          <RefreshCw size={24} />
          {t('adblock.refreshBtn', 'Refresh Page')}
        </button>
      </div>
    </div>
  )
}

export default AdBlockScreen
