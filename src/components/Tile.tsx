import React from 'react'
import type { Tile, Player } from '../types/game'
import { GAME_CONFIG } from '../config/gameConfig'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

interface TileProps {
  tile: Tile
  tilePlayers: Player[]
  owner?: Player
}

const TileComponent: React.FC<TileProps> = ({ tile, tilePlayers, owner }) => {
  const { t } = useTranslation()

  return (
    <div className="board-tile bg-white/80 backdrop-blur-sm border border-slate-200">
      {tile.color && (
        <div
          className="absolute top-0 left-0 right-0 h-4 border-b border-slate-400"
          style={{ backgroundColor: tile.color }}
        />
      )}
      <div className="mt-3 md:mt-5 font-bold uppercase tracking-tighter text-[7px] sm:text-[8px] md:text-[9px] font-arabic-pixel leading-tight">
        {t(`tiles.${tile.name.toLowerCase().replace(/ /g, '-')}`)}
      </div>

      {tile.price && (
        <div className="text-[6px] sm:text-[7px] md:text-[8px] text-slate-600 font-english-pixel mt-auto mb-1">
          {tile.price} {GAME_CONFIG.CURRENCY}
        </div>
      )}

      <div className="flex flex-wrap gap-0.5 md:gap-1 justify-center mb-1 relative z-20 w-full px-1">
        {tilePlayers.map((p) => (
          <motion.div
            key={p.id}
            layoutId={`player-${p.id}`}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: p.color }}
            title={p.name}
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
