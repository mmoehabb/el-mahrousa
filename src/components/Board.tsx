import React, { useState, useEffect, useMemo } from 'react'
import { useGame } from '../context/GameContext'
import type { Player, GameAction, Tile } from '../types/game'
import TileComponent from './Tile'
import PropertyModal from './PropertyModal'
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
}

const Board: React.FC<BoardProps> = ({ handleRoll, isMyTurn, sendAction }) => {
  const { t } = useTranslation()
  const { gameState, myId } = useGame()
  const tiles = gameState.tiles

  const [selectedTile, setSelectedTile] = useState<Tile | null>(null)

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

  // Split tiles for the 4 sides of the 6x6 board
  const bottomRow = tiles.slice(0, 7).reverse() // 0 to 6
  const leftCol = tiles.slice(7, 12).reverse() // 7 to 11
  const topRow = tiles.slice(12, 19) // 12 to 18
  const rightCol = tiles.slice(19, 24) // 19 to 23

  const { playersByPosition, ownerByTile } = useMemo(() => {
    const playersMap: Record<number, Player[]> = {}
    const ownerMap: Record<number, Player> = {}

    gameState.players.forEach((p) => {
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
    setSelectedTile(tile)
  }

  return (
    <div className="relative p-1 sm:p-2 md:p-4 bg-egyptian-pattern rounded-lg shadow-2xl border-2 md:border-4 border-egyptian-gold aspect-square w-[95vw] sm:w-[600px] md:w-[700px] lg:w-[800px] max-w-full">
      <PropertyModal
        isOpen={!!selectedTile}
        onClose={() => setSelectedTile(null)}
        tile={selectedTile}
        owner={selectedTile ? ownerByTile[selectedTile.id] : undefined}
        isMyTurn={isMyTurn}
        myId={myId}
        myBalance={gameState.players.find((p) => p.id === myId)?.balance || 0}
        turnPhase={gameState.turnPhase}
        sendAction={sendAction}
      />
      <div className="grid grid-cols-7 grid-rows-7 gap-0.5 sm:gap-1 w-full h-full">
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
            className="col-start-7"
            style={{ gridColumnStart: 7, gridRowStart: i + 2 }}
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
            style={{ gridColumnStart: i + 1, gridRowStart: 7 }}
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
        <div className="col-start-2 col-end-7 row-start-2 row-end-7 flex flex-col items-center justify-center bg-sand/20 dark:bg-slate-900/50 backdrop-blur-sm m-1 sm:m-2 border-2 border-egyptian-gold/40 rounded-lg relative p-2 sm:p-4 space-y-2 sm:space-y-4">
          <div className="flex gap-2 sm:gap-4 bg-white/50 dark:bg-slate-800/80 p-2 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-md border border-white/50 dark:border-slate-700/50 shadow-xl scale-75 sm:scale-100">
            <motion.div
              animate={gameState.turnPhase === 'ROLLING' ? { rotate: 360 } : {}}
              transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}
            >
              <DiceFace
                value={effectiveDisplayDice[0]}
                aria-label={`First die showing ${effectiveDisplayDice[0]}`}
              />
            </motion.div>
            <motion.div
              animate={gameState.turnPhase === 'ROLLING' ? { rotate: -360 } : {}}
              transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}
            >
              <DiceFace
                value={effectiveDisplayDice[1]}
                aria-label={`Second die showing ${effectiveDisplayDice[1]}`}
              />
            </motion.div>
          </div>

          <div className="w-full max-w-[200px] sm:max-w-xs space-y-1 sm:space-y-2">
            {gameState.turnPhase === 'ROLL' && (
              <button
                onClick={handleRoll}
                disabled={!isMyTurn}
                className="w-full bg-egyptian-blue text-white py-2 sm:py-3 rounded-lg sm:rounded-xl font-black flex items-center justify-center gap-1 sm:gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 text-[10px] sm:text-sm shadow-md"
              >
                <Dice5 className="w-4 h-4 sm:w-6 sm:h-6" /> {t('game.rollDiceBtn')}
              </button>
            )}

            {gameState.turnPhase === 'ACTION' && (
              <div className="space-y-1 sm:space-y-2">
                {gameState.tiles[currentPlayer.position]?.price &&
                  !ownerByTile[currentPlayer.position] && (
                    <button
                      onClick={() => sendAction({ type: 'BUY' })}
                      disabled={
                        !isMyTurn ||
                        currentPlayer.balance < (gameState.tiles[currentPlayer.position].price || 0)
                      }
                      className="w-full bg-green-600 text-white py-1.5 sm:py-2 rounded md:rounded-lg font-bold hover:bg-green-700 text-[9px] sm:text-sm shadow-md"
                    >
                      {t('game.buyForBtn', {
                        price: gameState.tiles[currentPlayer.position].price,
                      })}
                    </button>
                  )}
                <button
                  onClick={() => sendAction({ type: 'END_TURN' })}
                  disabled={!isMyTurn}
                  className="w-full bg-slate-500 text-white py-1.5 sm:py-2 rounded md:rounded-lg font-bold hover:bg-slate-600 text-[9px] sm:text-sm shadow-md"
                >
                  {t('game.skipEndTurnBtn')}
                </button>
              </div>
            )}

            {gameState.turnPhase === 'END' && (
              <button
                onClick={() => sendAction({ type: 'END_TURN' })}
                disabled={!isMyTurn}
                className="w-full bg-egyptian-blue text-white py-1.5 sm:py-2 rounded md:rounded-lg font-bold text-[9px] sm:text-sm shadow-md"
              >
                {t('game.endTurnBtn')}
              </button>
            )}

            {/* Game Logs placed right below actions */}
            <div className="w-full mt-2 p-1 sm:p-2 text-start font-bold flex flex-col items-start overflow-y-auto max-h-24 sm:max-h-32 hide-scrollbar">
              {recentLogs.length > 0 ? (
                recentLogs.map((log, i) => {
                  const scale = 1 - (i / 6) * 0.35 // 100% to 65%
                  const opacity = 1 - (i / 6) * 0.5 // 100% to 50%
                  return (
                    <div
                      key={i}
                      className="text-[8px] sm:text-[10px] text-slate-700 dark:text-slate-200 leading-tight w-full origin-top-left rtl:origin-top-right"
                      style={{
                        transform: `scale(${scale})`,
                        opacity: opacity,
                        marginBottom: i === recentLogs.length - 1 ? 0 : '0.25rem',
                      }}
                    >
                      {renderLog(log)}
                    </div>
                  )
                })
              ) : (
                <div className="text-[8px] sm:text-[10px] text-slate-700 dark:text-slate-200 leading-tight w-full">
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
