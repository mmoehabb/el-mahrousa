import React from 'react'
import type { Tile, Player } from '../types/game'
import { GAME_CONFIG } from '../config/gameConfig'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'
import { getAvatarPath, AVATAR_NAMES } from '../utils/avatars'

interface TileProps {
  tile: Tile
  tilePlayers: Player[]
  owner?: Player
  onClick?: () => void
}

const TileComponent: React.FC<TileProps> = ({ tile, tilePlayers, owner, onClick }) => {
  const { t } = useTranslation()

  return (
    <div
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
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`w-8 h-8 rounded-full border-3 shadow-md overflow-hidden bg-white ${
              p.isBankrupt ? 'border-slate-400 opacity-60 grayscale' : ''
            }`}
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
