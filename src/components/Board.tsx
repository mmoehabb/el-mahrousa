import React from 'react';
import { useGame } from '../context/GameContext';
import TileComponent from './Tile';

const Board: React.FC = () => {
  const { gameState } = useGame();
  const tiles = gameState.tiles;

  // Split tiles for the 4 sides of the 6x6 board
  const bottomRow = tiles.slice(0, 7).reverse(); // 0 to 6
  const leftCol = tiles.slice(7, 12).reverse();   // 7 to 11
  const topRow = tiles.slice(12, 19);            // 12 to 18
  const rightCol = tiles.slice(19, 24);          // 19 to 23

  return (
    <div className="relative p-8 bg-egyptian-pattern rounded-lg shadow-2xl border-4 border-egyptian-gold inline-block">
      <div className="grid grid-cols-7 grid-rows-7 gap-1">
        {/* Top Row */}
        {topRow.map((tile, i) => (
          <div key={tile.id} className="col-start-1" style={{ gridColumnStart: i + 1, gridRowStart: 1 }}>
            <TileComponent tile={tile} players={gameState.players} />
          </div>
        ))}

        {/* Left Column */}
        {leftCol.map((tile, i) => (
          <div key={tile.id} className="col-start-1" style={{ gridColumnStart: 1, gridRowStart: i + 2 }}>
            <TileComponent tile={tile} players={gameState.players} />
          </div>
        ))}

        {/* Right Column */}
        {rightCol.map((tile, i) => (
          <div key={tile.id} className="col-start-7" style={{ gridColumnStart: 7, gridRowStart: i + 2 }}>
            <TileComponent tile={tile} players={gameState.players} />
          </div>
        ))}

        {/* Bottom Row */}
        {bottomRow.map((tile, i) => (
          <div key={tile.id} className="col-start-1" style={{ gridColumnStart: i + 1, gridRowStart: 7 }}>
            <TileComponent tile={tile} players={gameState.players} />
          </div>
        ))}

        {/* Center */}
        <div className="col-start-2 col-end-7 row-start-2 row-end-7 flex flex-col items-center justify-center bg-sand/20 backdrop-blur-sm m-2 border-2 border-egyptian-gold/30 rounded-lg">
           <h1 className="text-4xl font-black text-egyptian-blue drop-shadow-md">MISR-OPOLY</h1>
           <div className="text-egyptian-gold font-bold">مصـر-وبولـي</div>
        </div>
      </div>
    </div>
  );
};

export default Board;
