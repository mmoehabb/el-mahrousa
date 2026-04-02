import React from 'react'
import { useTranslation } from 'react-i18next'
import { Trophy, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Player } from '../types/game'

interface WinnerModalProps {
  isOpen: boolean
  winner?: Player
  isHost: boolean
  onRematch: () => void
}

const WinnerModal: React.FC<WinnerModalProps> = ({ isOpen, winner, isHost, onRematch }) => {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-sand w-full max-w-md rounded-2xl shadow-2xl border-4 border-egyptian-gold overflow-hidden"
        >
          <div className="bg-egyptian-blue p-6 text-center text-white relative">
            <Trophy className="w-16 h-16 mx-auto mb-2 text-egyptian-gold drop-shadow-lg" />
            <h2 className="text-3xl font-black font-english-pixel tracking-widest uppercase">
              {t('game.gameOver')}
            </h2>
          </div>

          <div className="p-8 text-center space-y-6">
            <div className="text-2xl font-bold">
              {winner ? t('game.winnerIs', { name: winner.name }) : t('game.everyoneBankrupt')}
            </div>

            {isHost ? (
              <button
                onClick={onRematch}
                className="w-full bg-egyptian-gold text-white py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <RotateCcw className="w-6 h-6" />
                {t('game.rematchBtn')}
              </button>
            ) : (
              <div className="opacity-70 font-semibold animate-pulse">
                {t('game.waitingForHostRematch')}
              </div>
            )}

            <button
              onClick={() => (window.location.href = import.meta.env.BASE_URL || '/')}
              className="w-full bg-slate-200 dark:bg-slate-700 py-3 rounded-lg font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              {t('game.leaveGameBtn')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default WinnerModal
