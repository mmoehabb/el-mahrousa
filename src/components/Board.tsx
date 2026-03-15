import React, { useState, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import TileComponent from './Tile'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

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

  const isRolling = gameState.turnPhase === 'ROLLING'
  const [rollingDice, setRollingDice] = useState<[number, number]>([1, 1])

  useEffect(() => {
    let interval: number
    if (isRolling) {
      interval = setInterval(() => {
        setRollingDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1])
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isRolling])

  const effectiveDisplayDice = isRolling ? rollingDice : gameState.lastDice

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
        <div className="col-start-2 col-end-7 row-start-2 row-end-7 flex flex-col items-center justify-center bg-sand/20 backdrop-blur-sm m-2 border-2 border-egyptian-gold/40 rounded-lg relative">
          <h1 className="text-4xl font-black text-egyptian-blue drop-shadow-md z-10 font-english-pixel">
            EL-MAHROUSA
          </h1>
          <div className="text-egyptian-gold font-bold z-10 font-arabic-pixel">
            {t('lobby.titleAr')}
          </div>

          <AnimatePresence>
            {(gameState.turnPhase === 'ROLLING' || gameState.turnPhase === 'MOVING') && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute bottom-10 flex gap-4 bg-white/50 p-4 rounded-2xl backdrop-blur-md border border-white/50 shadow-xl"
              >
                <motion.div
                  animate={gameState.turnPhase === 'ROLLING' ? { rotate: 360 } : {}}
                  transition={{
                    repeat: Infinity,
                    duration: 0.5,
                    ease: 'easeInOut',
                  }}
                >
                  <DiceFace
                    value={effectiveDisplayDice[0]}
                    aria-label={`First die showing ${effectiveDisplayDice[0]}`}
                  />
                </motion.div>
                <motion.div
                  animate={gameState.turnPhase === 'ROLLING' ? { rotate: -360 } : {}}
                  transition={{
                    repeat: Infinity,
                    duration: 0.5,
                    ease: 'easeInOut',
                  }}
                >
                  <DiceFace
                    value={effectiveDisplayDice[1]}
                    aria-label={`Second die showing ${effectiveDisplayDice[1]}`}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default Board
