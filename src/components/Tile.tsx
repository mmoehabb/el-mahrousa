import React from 'react'
import type { Tile, Player } from '../types/game'
import { GAME_CONFIG } from '../config/gameConfig'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Home } from 'lucide-react'
import { getAvatarPath, AVATAR_NAMES } from '../utils/avatars'
import { useGame } from '../context/GameContext'
import { useEffect, useState } from 'react'

interface TileProps {
  tile: Tile
  tilePlayers: Player[]
  owner?: Player
  onClick?: () => void
}

const TileComponent: React.FC<TileProps> = ({ tile, tilePlayers, owner, onClick }) => {
  const { t } = useTranslation()
  const { gameState } = useGame()
  const [balanceChanges, setBalanceChanges] = useState<
    Record<string, { diff: number; id: number }[]>
  >({})
  const [prevBalances, setPrevBalances] = useState<Record<string, number>>({})

  useEffect(() => {
    tilePlayers.forEach((p) => {
      const prev = prevBalances[p.id]
      if (prev !== undefined && prev !== p.balance) {
        const diff = p.balance - prev
        setBalanceChanges((current) => ({
          ...current,
          [p.id]: [...(current[p.id] || []), { diff, id: Date.now() }],
        }))

        // Remove after 2 seconds
        setTimeout(() => {
          setBalanceChanges((current) => ({
            ...current,
            [p.id]: current[p.id]?.slice(1) || [],
          }))
        }, 2000)
      }
      setPrevBalances((current) => ({ ...current, [p.id]: p.balance }))
    })
  }, [tilePlayers.map((p) => p.balance).join(',')])

  return (
    <div
      id={`tile-${tile.id}`}
      className={`board-tile bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 ${onClick ? 'cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors' : ''}`}
      onClick={onClick}
    >
      {tile.color && (
        <div
          className="absolute top-0 left-0 right-0 h-4 border-b border-slate-400 dark:border-slate-600"
          style={{ backgroundColor: tile.color }}
        />
      )}
      <div className="mt-5 font-bold uppercase tracking-tighter text-[14px] font-arabic-pixel leading-tight">
        {t(`tiles.${tile.name.toLowerCase().replace(/ /g, '-')}`)}
      </div>

      {tile.price && (
        <div className="text-[8px] text-slate-600 dark:text-slate-300 font-english-pixel mt-auto mb-1">
          {tile.price} {GAME_CONFIG.CURRENCY}
        </div>
      )}

      {/* Houses Container */}
      {tile.houses ? (
        <div className="absolute top-0.5 right-0.5 flex gap-0.5 z-30">
          <div className="bg-white/80 dark:bg-slate-800/80 rounded px-0.5 flex items-center shadow-sm text-egyptian-blue dark:text-egyptian-gold">
            <Home className="w-4 h-4" />
            <span className="text-xs font-bold font-english-pixel ml-0.5">{tile.houses}</span>
          </div>
        </div>
      ) : null}

      {/* Container for players, absolutely positioned near the center to avoid shifting layout */}
      <div className="absolute inset-0 flex flex-wrap content-center justify-center gap-1.5 z-20 pointer-events-none p-1 pt-6">
        {tilePlayers.map((p) => (
          <motion.div
            key={p.id}
            layoutId={`player-${p.id}`}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              bounce: 0.5,
            }}
            initial={{ scale: 0.8 }}
            animate={
              p.isBankrupt
                ? { scale: 1, y: 0, opacity: 0.6, rotate: 90, filter: 'grayscale(100%)' }
                : { scale: 1, y: [0, -15, 0] }
            }
            className={`w-10 h-10 rounded-full border-[3px] shadow-md overflow-hidden bg-white ${
              p.isBankrupt ? 'border-slate-400' : ''
            } relative`}
            style={{ borderColor: p.isBankrupt ? '#94a3b8' : p.color }}
            title={`${p.name}${p.isBankrupt ? ` (${t('game.bankruptLabel')})` : ''}`}
            role="img"
            aria-label={`${p.name} piece`}
            tabIndex={0}
          >
            <img
              src={getAvatarPath(p.avatar)}
              alt={AVATAR_NAMES[p.avatar] || p.name}
              className="w-full h-full object-cover"
            />
            {/* Floating Text Animation */}
            <AnimatePresence>
              {(balanceChanges[p.id] || []).map((change, i) => (
                <motion.div
                  key={change.id}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: -40 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className={`absolute top-[-20px] left-1/2 transform -translate-x-1/2 font-bold text-sm z-50 whitespace-nowrap ${
                    change.diff > 0
                      ? 'text-green-500 drop-shadow-md'
                      : 'text-red-500 drop-shadow-md'
                  }`}
                >
                  {change.diff > 0 ? '+' : ''}
                  {change.diff}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Jail Overlay Animation */}
            <AnimatePresence>
              {p.jailTurns > 0 && (
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -50, opacity: 0 }}
                  transition={{ type: 'spring', bounce: 0.6 }}
                  className="absolute inset-0 flex space-x-1 p-1 bg-black/40"
                  style={{ gap: '2px', padding: '4px' }}
                >
                  <div className="w-1 bg-gray-400 h-full"></div>
                  <div className="w-1 bg-gray-400 h-full"></div>
                  <div className="w-1 bg-gray-400 h-full"></div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bankruptcy Overlay Animation */}
            <AnimatePresence>
              {p.isBankrupt && (
                <motion.div
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/60"
                >
                  <span className="text-red-500 font-bold text-[24px]">X</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {owner && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: owner.color }}
        />
      )}
    </div>
  )
}

export default TileComponent
