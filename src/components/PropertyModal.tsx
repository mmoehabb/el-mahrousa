import React from 'react'
import { useTranslation } from 'react-i18next'
import { X, Home } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'
import type { Tile, Player, GameAction } from '../types/game'
import { GAME_CONFIG } from '../config/gameConfig'

interface PropertyModalProps {
  isOpen: boolean
  onClose: () => void
  tile: Tile | null
  owner?: Player
  isMyTurn: boolean
  myId: string
  myBalance: number
  turnPhase: string
  sendAction: (action: GameAction) => void
}

const PropertyModal: React.FC<PropertyModalProps> = ({
  isOpen,
  onClose,
  tile,
  owner,
  isMyTurn,
  myId,
  myBalance,
  turnPhase,
  sendAction,
}) => {
  const { t } = useTranslation()
  const { gameState } = useGame()

  if (!isOpen || !tile) return null

  const isOwner = owner?.id === myId
  const canAct = isMyTurn && turnPhase === 'ROLL' && isOwner
  const currentHouses = tile.houses || 0
  const maxHouses = tile.rent ? tile.rent.length - 1 : 0

  let ownsAllInGroup = false
  if (tile.group && owner) {
    const groupTiles = gameState.tiles.filter((t) => t.group === tile.group)
    ownsAllInGroup = groupTiles.every((t) => owner.properties.includes(t.id))
  }

  const buyCost = tile.housePrice ? tile.housePrice * Math.pow(2, currentHouses) : 0
  const sellHouseRefund =
    tile.housePrice && currentHouses > 0
      ? (tile.housePrice * Math.pow(2, currentHouses - 1)) / 2
      : 0
  const sellPropertyRefund = tile.price ? tile.price / 2 : 0

  const handleBuyHouse = () => {
    sendAction({ type: 'BUY_HOUSE', tileId: tile.id })
    onClose()
  }

  const handleSellHouse = () => {
    sendAction({ type: 'SELL_HOUSE', tileId: tile.id })
    onClose()
  }

  const handleSellProperty = () => {
    sendAction({ type: 'SELL_PROPERTY', tileId: tile.id })
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-sand dark:bg-slate-800 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="p-4 text-center relative border-b-4 border-slate-800 dark:border-slate-900"
            style={{ backgroundColor: tile.color || '#fff', color: tile.color ? '#fff' : '#000' }}
          >
            <button
              onClick={onClose}
              className="absolute z-10 top-2 right-2 rtl:left-2 rtl:right-auto bg-black/20 hover:bg-black/40 rounded-full p-1 transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
            <h2 className="text-xl font-black uppercase tracking-wider drop-shadow-md text-white relative z-0 px-8">
              {t(`tiles.${tile.name.toLowerCase().replace(/ /g, '-')}`)}
            </h2>
          </div>

          <div className="p-6 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200">
            {/* Ownership info */}
            <div className="mb-4 text-center">
              {owner ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: owner.color }} />
                  <span className="font-bold text-sm">
                    {t('game.ownedBy', { name: owner.name })}
                    {isOwner ? ` (${t('waiting.you')})` : ''}
                  </span>
                </div>
              ) : (
                <div className="inline-block px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-800 font-bold text-sm">
                  {t('game.unowned')}
                </div>
              )}
            </div>

            {/* Rent Table */}
            {tile.type === 'PROPERTY' && tile.rent && (
              <div className="space-y-2 mb-6">
                <div className="flex justify-between font-bold border-b border-slate-200 dark:border-slate-700 pb-1">
                  <span>{t('game.rentLevel')}</span>
                  <span>{t('game.amount')}</span>
                </div>
                {tile.rent.map((amount, idx) => (
                  <div
                    key={idx}
                    className={`flex justify-between text-sm py-1 px-2 rounded ${
                      currentHouses === idx
                        ? 'bg-egyptian-gold/20 font-bold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {idx === 0
                        ? t('game.baseRent')
                        : idx === maxHouses
                          ? t('game.hotelRent')
                          : `${idx} ${t('game.houses')}`}
                      {currentHouses === idx && (
                        <Home size={14} className="text-egyptian-blue dark:text-egyptian-gold" />
                      )}
                    </span>
                    <span>
                      {amount} {GAME_CONFIG.CURRENCY}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Price Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-center">
              {tile.price && (
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-500 dark:text-slate-400">
                    {t('game.propertyPrice')}
                  </div>
                  <div className="font-bold">
                    {tile.price} {GAME_CONFIG.CURRENCY}
                  </div>
                </div>
              )}
              {tile.housePrice && (
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-500 dark:text-slate-400">
                    {t('game.houseBasePrice')}
                  </div>
                  <div className="font-bold">
                    {tile.housePrice} {GAME_CONFIG.CURRENCY}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {canAct && tile.type === 'PROPERTY' && (
              <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={handleBuyHouse}
                  disabled={currentHouses >= maxHouses || myBalance < buyCost || !ownsAllInGroup}
                  className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-between px-4 rtl:text-lg rtl:py-1"
                >
                  <span>{t('game.buyHouseBtn')}</span>
                  {currentHouses < maxHouses && (
                    <span>
                      {buyCost} {GAME_CONFIG.CURRENCY}
                    </span>
                  )}
                </button>
                {!ownsAllInGroup && currentHouses < maxHouses && (
                  <div className="text-xs text-center text-red-500 mt-1">
                    {t('game.mustOwnAllInGroup')}
                  </div>
                )}

                <button
                  onClick={handleSellHouse}
                  disabled={currentHouses === 0}
                  className="w-full bg-orange-500 text-white py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-between px-4 rtl:text-lg rtl:py-1"
                >
                  <span>{t('game.sellHouseBtn')}</span>
                  {currentHouses > 0 && (
                    <span>
                      +{sellHouseRefund} {GAME_CONFIG.CURRENCY}
                    </span>
                  )}
                </button>

                <button
                  onClick={handleSellProperty}
                  disabled={currentHouses > 0}
                  className="w-full bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-between px-4 rtl:text-lg rtl:py-1"
                >
                  <span>{t('game.sellPropertyBtn')}</span>
                  {currentHouses === 0 && (
                    <span>
                      +{sellPropertyRefund} {GAME_CONFIG.CURRENCY}
                    </span>
                  )}
                </button>
                {currentHouses > 0 && (
                  <div className="text-xs text-center text-red-500 mt-1">
                    {t('game.mustSellHousesFirst')}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PropertyModal
