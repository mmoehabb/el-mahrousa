import React from 'react';
import type { Tile, Player } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { motion } from 'framer-motion';

interface TileProps {
  tile: Tile;
  players: Player[];
}

const TileComponent: React.FC<TileProps> = ({ tile, players }) => {
  const tilePlayers = players.filter(p => p.position === tile.id);
  const owner = players.find(p => p.properties.includes(tile.id));

  return (
    <div className="board-tile min-w-[100px] min-h-[100px] bg-white/80 backdrop-blur-sm">
      {tile.color && (
        <div
          className="absolute top-0 left-0 right-0 h-4 border-b border-slate-400"
          style={{ backgroundColor: tile.color }}
        />
      )}
      <div className="mt-5 font-bold uppercase tracking-tighter text-[9px]">
        {tile.name}
      </div>

      {tile.price && (
        <div className="text-[8px] text-slate-600">
          {tile.price} {GAME_CONFIG.CURRENCY}
        </div>
      )}

      <div className="flex flex-wrap gap-1 justify-center mb-1 relative z-20">
        {tilePlayers.map(p => (
          <motion.div
            key={p.id}
            layoutId={`player-${p.id}`}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-3 h-3 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: p.color }}
            title={p.name}
          />
        ))}
      </div>

      {owner && (
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: owner.color }} />
      )}
    </div>
  );
};

export default TileComponent;
