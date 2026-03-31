import React from 'react'
import type { Tile, Player } from '../types/game'
import { GAME_CONFIG } from '../config/gameConfig'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Home } from 'lucide-react'
import { getAvatarPath, AVATAR_NAMES } from '../utils/avatars'

interface TileProps {
  tile: Tile
  tilePlayers: Player[]
  owner?: Player
  onClick?: () => void
  balanceChanges?: Record<string, { diff: number; id: number }[]>
}

import { useGame } from '../context/GameContext'

const TileComponent: React.FC<TileProps> = ({
  tile,
  tilePlayers,
  owner,
  onClick,
  balanceChanges = {},
}) => {
  const { t } = useTranslation()
  const { gameState } = useGame()

  return (
    <div
      id={`tile-${tile.id}`}
      className={`board-tile bg-white/80 dark:bg-[#0b021a]/85 backdrop-blur-sm border border-slate-200 dark:border-pink-500/40 dark:shadow-[0_0_10px_rgba(224,17,95,0.2)] ${onClick ? 'cursor-pointer hover:bg-white dark:hover:bg-[#1a0b2e] transition-colors' : ''}`}
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
          <div key={p.id} className="relative z-30">
            {/* Floating Text Animation OUTSIDE overflow-hidden container */}
            <AnimatePresence>
              {(balanceChanges[p.id] || []).map((change) => (
                <motion.div
                  key={change.id}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: -40 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className={`absolute top-[-10px] left-1/2 transform -translate-x-1/2 font-black text-[20px] z-[100] whitespace-nowrap pointer-events-none ${
                    change.diff > 0
                      ? 'text-green-400 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]'
                      : 'text-red-500 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]'
                  }`}
                >
                  {change.diff > 0 ? '+' : ''}
                  {change.diff}
                </motion.div>
              ))}
            </AnimatePresence>

            <motion.div
              layoutId={`player-${p.id}`}
              layout="position"
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
                mass: 0.8,
                bounce: 0.6,
                duration: 0.6,
              }}
              initial={{ scale: 0.8 }}
              animate={
                p.isBankrupt
                  ? { scale: 1, y: 0, opacity: 0.6, rotate: 90, filter: 'grayscale(100%)' }
                  : { scale: 1, y: [0, -20, 0] }
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
                className="w-full h-full object-cover pointer-events-auto"
              />
              {/* Jail Overlay Animation */}
              <AnimatePresence>
                {(gameState.prison[p.id]?.turnsLeft ?? 0) > 0 && (
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
          </div>
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
