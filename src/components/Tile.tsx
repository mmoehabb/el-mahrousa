import React from 'react'
import type { Tile, Player } from '../types/game'
import { GAME_CONFIG } from '../config/gameConfig'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'

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
      <div className="mt-3 md:mt-5 font-bold uppercase tracking-tighter text-[10px] sm:text-[12px] md:text-[14px] font-arabic-pixel leading-tight">
        {t(`tiles.${tile.name.toLowerCase().replace(/ /g, '-')}`)}
      </div>

      {tile.price && (
        <div className="text-[6px] sm:text-[7px] md:text-[8px] text-slate-600 dark:text-slate-300 font-english-pixel mt-auto mb-0.5 md:mb-1">
          {tile.price} {GAME_CONFIG.CURRENCY}
        </div>
      )}

      {/* Houses Container */}
      {tile.houses ? (
        <div className="absolute top-0.5 right-0.5 flex gap-0.5 z-30">
          <div className="bg-white/80 dark:bg-slate-800/80 rounded px-0.5 flex items-center shadow-sm text-egyptian-blue dark:text-egyptian-gold">
            <Home className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
            <span className="text-[8px] sm:text-[10px] md:text-xs font-bold font-english-pixel ml-0.5">
              {tile.houses}
            </span>
          </div>
        </div>
      ) : null}

      {/* Container for players, absolutely positioned near the center to avoid shifting layout */}
      <div className="absolute inset-0 flex flex-wrap content-center justify-center gap-0.5 md:gap-1 z-20 pointer-events-none p-1 pt-6">
        {tilePlayers.map((p) => (
          <motion.div
            key={p.id}
            layoutId={`player-${p.id}`}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full border shadow-sm ${p.isBankrupt ? 'border-slate-400 opacity-60' : 'border-white'}`}
            style={{ backgroundColor: p.isBankrupt ? '#94a3b8' : p.color }}
            title={`${p.name}${p.isBankrupt ? ' (Bankrupt)' : ''}`}
            role="img"
            aria-label={`${p.name} piece`}
            tabIndex={0}
          />
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
