import React from 'react'
import { useGame } from '../context/GameContext'
import TileComponent from './Tile'
import { useTranslation } from 'react-i18next'
const DiceFace: React.FC<{ value: number; 'aria-label'?: string }> = ({
  value,
  'aria-label': ariaLabel,
}) => {
  const dots = Array(value).fill(0)
  return (
    <div
      className="w-12 h-12 bg-white rounded-xl shadow-lg border-2 border-slate-200 flex flex-wrap justify-center items-center p-1 gap-1"
      role="img"
      aria-label={ariaLabel || `Dice showing ${value}`}
    >
      {dots.map((_, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 bg-egyptian-blue rounded-full font-english-pixel text-xs"
        />
      ))}
    </div>
  )
}

const Board: React.FC = () => {
  const { t } = useTranslation()
  const { gameState } = useGame()
  const tiles = gameState.tiles

  // Split tiles for the 4 sides of the 6x6 board
  const bottomRow = tiles.slice(0, 7).reverse() // 0 to 6
  const leftCol = tiles.slice(7, 12).reverse() // 7 to 11
  const topRow = tiles.slice(12, 19) // 12 to 18
  const rightCol = tiles.slice(19, 24) // 19 to 23

  return (
    <div className="relative p-8 bg-egyptian-pattern rounded-lg shadow-2xl border-4 border-egyptian-gold inline-block">
      <div className="grid grid-cols-7 grid-rows-7 gap-1">
        {/* Top Row */}
        {topRow.map((tile, i) => (
          <div
            key={tile.id}
            className="col-start-1"
            style={{ gridColumnStart: i + 1, gridRowStart: 1 }}
          >
            <TileComponent tile={tile} players={gameState.players} />
          </div>
        ))}

        {/* Left Column */}
        {leftCol.map((tile, i) => (
          <div
            key={tile.id}
            className="col-start-1"
            style={{ gridColumnStart: 1, gridRowStart: i + 2 }}
          >
            <TileComponent tile={tile} players={gameState.players} />
          </div>
        ))}

        {/* Right Column */}
        {rightCol.map((tile, i) => (
          <div
            key={tile.id}
            className="col-start-7"
            style={{ gridColumnStart: 7, gridRowStart: i + 2 }}
          >
            <TileComponent tile={tile} players={gameState.players} />
          </div>
        ))}

        {/* Bottom Row */}
        {bottomRow.map((tile, i) => (
          <div
            key={tile.id}
            className="col-start-1"
            style={{ gridColumnStart: i + 1, gridRowStart: 7 }}
          >
            <TileComponent tile={tile} players={gameState.players} />
          </div>
        ))}

        {/* Center */}
        <div className="col-start-2 col-end-7 row-start-2 row-end-7 flex flex-col items-center justify-center bg-sand/20 backdrop-blur-sm m-2 border-2 border-egyptian-gold/40 rounded-lg relative overflow-hidden">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-egyptian-blue drop-shadow-md z-10 font-english-pixel text-center px-4">
            EL-MAHROUSA
          </h1>
          <div className="text-egyptian-gold font-bold z-10 font-arabic-pixel text-xl sm:text-2xl mt-2 text-center">
            {t('lobby.titleAr')}
          </div>
        </div>
      </div>
    </div>
  )
}

export { DiceFace }
export default Board
