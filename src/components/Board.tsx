import React, { useState, useEffect, useMemo } from 'react'
import { useGame } from '../context/GameContext'
import type { Player, GameAction, Tile } from '../types/game'
import TileComponent from './Tile'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Dice5 } from 'lucide-react'

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

interface BoardProps {
  handleRoll: () => void
  isMyTurn: boolean
  sendAction: (action: GameAction) => void
  onTileClick: (tile: Tile) => void
}

const Board: React.FC<BoardProps> = ({ handleRoll, isMyTurn, sendAction, onTileClick }) => {
  const { t } = useTranslation()
  const { gameState } = useGame()
  const tiles = gameState.tiles


  const isRolling = gameState.turnPhase === 'ROLLING'
  const [rollingDice, setRollingDice] = useState<[number, number]>([1, 1])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isRolling) {
      interval = setInterval(() => {
        const array = new Uint32Array(2)
        crypto.getRandomValues(array)
        const d1 = Math.floor((array[0] / (0xffffffff + 1)) * 6) + 1
        const d2 = Math.floor((array[1] / (0xffffffff + 1)) * 6) + 1
        setRollingDice([d1, d2])
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isRolling])

  const effectiveDisplayDice = isRolling ? rollingDice : gameState.lastDice

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]

  // Extract the latest up to 7 game logs to show in the center
  const recentLogs = gameState.logs.slice(0, 7)
  const renderLog = (log: (typeof gameState.logs)[0]) => {
    if (!log) return t('game.gameLogs')
    if (typeof log === 'string') return log
    if (log.key) {
      const translatedParams = { ...log.params }
      if (translatedParams.property) {
        const propName = String(translatedParams.property)
        translatedParams.property = t(`tiles.${propName.toLowerCase().replace(/ /g, '-')}`)
      }
      return t(`logs.${log.key}`, translatedParams) as string
    }
    return JSON.stringify(log)
  }

  // Split tiles for the 4 sides of the 10x10 board (40 tiles)
  const bottomRow = tiles.slice(0, 11).reverse() // 0 to 10
  const leftCol = tiles.slice(11, 20).reverse() // 11 to 19
  const topRow = tiles.slice(20, 31) // 20 to 30
  const rightCol = tiles.slice(31, 40) // 31 to 39

  const { playersByPosition, ownerByTile } = useMemo(() => {
    const playersMap: Record<number, Player[]> = {}
    const ownerMap: Record<number, Player> = {}
    const playerMap: Record<string, Player> = {}

    gameState.players.forEach((p) => {
      playerMap[p.id] = p

      if (!playersMap[p.position]) {
        playersMap[p.position] = []
      }
      playersMap[p.position].push(p)

      p.properties.forEach((propId) => {
        ownerMap[propId] = p
      })
    })

    return { playersByPosition: playersMap, ownerByTile: ownerMap }
  }, [gameState.players])

  const handleTileClick = (tile: Tile) => {
    onTileClick(tile)
  }

  return (
    <div className="relative p-1 sm:p-2 md:p-4 bg-egyptian-pattern rounded-lg shadow-2xl border-2 md:border-4 border-egyptian-gold aspect-square w-[800px] sm:w-[850px] md:w-[950px] lg:w-[1050px] xl:w-[1200px] max-w-none overflow-hidden">
      <div
        className="grid gap-0.5 sm:gap-1 w-full h-full"
        style={{
          gridTemplateColumns: '1.4fr repeat(9, 1fr) 1.4fr',
          gridTemplateRows: '1.4fr repeat(9, 1fr) 1.4fr',
        }}
      >
        {/* Top Row */}
        {topRow.map((tile, i) => (
          <div
            key={tile.id}
            className="col-start-1"
            style={{ gridColumnStart: i + 1, gridRowStart: 1 }}
          >
            <TileComponent
              tile={tile}
              tilePlayers={playersByPosition[tile.id] || []}
              owner={ownerByTile[tile.id]}
              onClick={() => handleTileClick(tile)}
            />
          </div>
        ))}

        {/* Left Column */}
        {leftCol.map((tile, i) => (
          <div
            key={tile.id}
            className="col-start-1"
            style={{ gridColumnStart: 1, gridRowStart: i + 2 }}
          >
            <TileComponent
              tile={tile}
              tilePlayers={playersByPosition[tile.id] || []}
              owner={ownerByTile[tile.id]}
              onClick={() => handleTileClick(tile)}
            />
          </div>
        ))}

        {/* Right Column */}
        {rightCol.map((tile, i) => (
          <div
            key={tile.id}
            className="col-start-11"
            style={{ gridColumnStart: 11, gridRowStart: i + 2 }}
          >
            <TileComponent
              tile={tile}
              tilePlayers={playersByPosition[tile.id] || []}
              owner={ownerByTile[tile.id]}
              onClick={() => handleTileClick(tile)}
            />
          </div>
        ))}

        {/* Bottom Row */}
        {bottomRow.map((tile, i) => (
          <div
            key={tile.id}
            className="col-start-1"
            style={{ gridColumnStart: i + 1, gridRowStart: 11 }}
          >
            <TileComponent
              tile={tile}
              tilePlayers={playersByPosition[tile.id] || []}
              owner={ownerByTile[tile.id]}
              onClick={() => handleTileClick(tile)}
            />
          </div>
        ))}

        {/* Center */}
        <div className="col-start-2 col-end-11 row-start-2 row-end-11 flex flex-col items-center justify-center bg-sand/20 dark:bg-slate-900/50 backdrop-blur-sm m-1 sm:m-4 md:m-8 lg:m-12 border-2 md:border-4 border-egyptian-gold/40 rounded-lg relative p-4 sm:p-8 space-y-4 sm:space-y-6">
          <div className="flex gap-4 sm:gap-6 md:gap-8 bg-white/50 dark:bg-slate-800/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl backdrop-blur-md border border-white/50 dark:border-slate-700/50 shadow-xl scale-100 sm:scale-125 md:scale-150">
            <motion.div
              animate={{ rotate: gameState.turnPhase === 'ROLLING' ? 360 : 0 }}
              transition={{
                repeat: gameState.turnPhase === 'ROLLING' ? Infinity : 0,
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
              animate={{ rotate: gameState.turnPhase === 'ROLLING' ? -360 : 0 }}
              transition={{
                repeat: gameState.turnPhase === 'ROLLING' ? Infinity : 0,
                duration: 0.5,
                ease: 'easeInOut',
              }}
            >
              <DiceFace
                value={effectiveDisplayDice[1]}
                aria-label={`Second die showing ${effectiveDisplayDice[1]}`}
              />
            </motion.div>
          </div>

          <div className="w-full max-w-[250px] sm:max-w-sm md:max-w-md space-y-2 sm:space-y-4 md:mt-6">
            {isMyTurn && gameState.turnPhase === 'ROLL' && (
              <button
                onClick={handleRoll}
                className="w-full bg-egyptian-blue text-white py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 text-xs sm:text-base md:text-xl shadow-lg"
              >
                <Dice5 className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" /> {t('game.rollDiceBtn')}
              </button>
            )}

            {isMyTurn && gameState.turnPhase === 'ACTION' && (
              <div className="space-y-2 sm:space-y-4">
                {gameState.tiles[currentPlayer.position]?.price &&
                  !ownerByTile[currentPlayer.position] && (
                    <button
                      onClick={() => sendAction({ type: 'BUY' })}
                      disabled={
                        currentPlayer.balance < (gameState.tiles[currentPlayer.position].price || 0)
                      }
                      className="w-full bg-green-600 text-white py-2 sm:py-3 md:py-4 rounded-lg md:rounded-xl font-bold hover:bg-green-700 text-[10px] sm:text-sm md:text-lg shadow-md"
                    >
                      {t('game.buyForBtn', {
                        price: gameState.tiles[currentPlayer.position].price,
                      })}
                    </button>
                  )}
                <button
                  onClick={() => sendAction({ type: 'END_TURN' })}
                  className="w-full bg-slate-500 text-white py-2 sm:py-3 md:py-4 rounded-lg md:rounded-xl font-bold hover:bg-slate-600 text-[10px] sm:text-sm md:text-lg shadow-md"
                >
                  {t('game.skipEndTurnBtn')}
                </button>
              </div>
            )}

            {isMyTurn && gameState.turnPhase === 'END' && (
              <button
                onClick={() => sendAction({ type: 'END_TURN' })}
                className="w-full bg-egyptian-blue text-white py-2 sm:py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-[10px] sm:text-sm md:text-lg shadow-md"
              >
                {t('game.endTurnBtn')}
              </button>
            )}

            {/* Game Logs placed right below actions */}
            <div className="w-full mt-4 p-2 sm:p-4 bg-white/40 dark:bg-slate-800/60 rounded-xl backdrop-blur-sm border border-white/30 dark:border-slate-600/30 text-start font-bold flex flex-col items-start overflow-y-auto max-h-32 sm:max-h-48 md:max-h-56 hide-scrollbar shadow-inner">
              {recentLogs.length > 0 ? (
                recentLogs.map((log, i) => {
                  const scale = 1 - (i / 6) * 0.35 // 100% to 65%
                  const opacity = 1 - (i / 6) * 0.5 // 100% to 50%
                  return (
                    <div
                      key={i}
                      className="text-[10px] sm:text-xs md:text-sm text-slate-800 dark:text-slate-100 leading-tight w-full origin-top-left rtl:origin-top-right py-0.5"
                      style={{
                        transform: `scale(${scale})`,
                        opacity: opacity,
                        marginBottom: i === recentLogs.length - 1 ? 0 : '0.3rem',
                      }}
                    >
                      {renderLog(log)}
                    </div>
                  )
                })
              ) : (
                <div className="text-[10px] sm:text-xs md:text-sm text-slate-700 dark:text-slate-200 leading-tight w-full">
                  {t('game.gameLogs')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Board
