import React, { useState } from 'react'
import type { Player, Tile } from '../types/game'
import { GAME_CONFIG } from '../config/gameConfig'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface TradeModalProps {
  isOpen: boolean
  onClose: () => void
  players: Player[]
  myId: string
  allTiles: Tile[]
  onPropose: (partnerId: string, offer: TradeOffer) => void
}

export interface TradeOffer {
  myCash: number
  partnerCash: number
  myProperties: number[]
  partnerProperties: number[]
}

const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  players,
  myId,
  allTiles,
  onPropose,
}) => {
  const { t } = useTranslation()
  const me = players.find((p) => p.id === myId)
  const others = players.filter((p) => p.id !== myId)

  const [partnerId, setPartnerId] = useState(others[0]?.id || '')
  const [offer, setOffer] = useState<TradeOffer>({
    myCash: 0,
    partnerCash: 0,
    myProperties: [],
    partnerProperties: [],
  })

  if (!isOpen || !me) return null

  const partner = players.find((p) => p.id === partnerId)

  const toggleProperty = (id: number, isMine: boolean) => {
    setOffer((prev) => {
      const key = isMine ? 'myProperties' : 'partnerProperties'
      const exists = prev[key].includes(id)
      return {
        ...prev,
        [key]: exists ? prev[key].filter((pid) => pid !== id) : [...prev[key], id],
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-egyptian-blue text-white p-4 flex justify-between items-center">
          <h2 className="font-bold uppercase">{t('trade.title')}</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="p-4 flex gap-4 overflow-y-auto">
          {/* My side */}
          <div className="flex-1 space-y-4">
            <h3 className="font-bold border-b pb-1 text-sm">{t('trade.yourOffer')}</h3>
            <div className="space-y-2">
              <label className="text-xs text-slate-500 block">
                {t('game.currency', {
                  amount: GAME_CONFIG.CURRENCY,
                  currency: GAME_CONFIG.CURRENCY,
                })}
              </label>
              <input
                type="number"
                className="w-full border rounded p-1 text-sm"
                value={offer.myCash}
                onChange={(e) => setOffer({ ...offer, myCash: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500 block">{t('trade.properties')}</label>
              {me.properties.map((pid) => (
                <div
                  key={pid}
                  onClick={() => toggleProperty(pid, true)}
                  className={`text-[10px] p-1 border rounded cursor-pointer ${offer.myProperties.includes(pid) ? 'bg-egyptian-gold/20 border-egyptian-gold' : ''}`}
                >
                  {allTiles[pid].name}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center text-2xl">↔</div>

          {/* Partner side */}
          <div className="flex-1 space-y-4">
            <h3 className="font-bold border-b pb-1 text-sm">
              <select
                className="bg-transparent"
                value={partnerId}
                onChange={(e) => {
                  setPartnerId(e.target.value)
                  setOffer({ ...offer, partnerProperties: [], partnerCash: 0 })
                }}
              >
                {others.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </h3>
            {partner && (
              <>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 block">
                    {t('game.currency', {
                      amount: GAME_CONFIG.CURRENCY,
                      currency: GAME_CONFIG.CURRENCY,
                    })}
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded p-1 text-sm"
                    value={offer.partnerCash}
                    onChange={(e) =>
                      setOffer({ ...offer, partnerCash: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 block">{t('trade.properties')}</label>
                  {partner.properties.map((pid) => (
                    <div
                      key={pid}
                      onClick={() => toggleProperty(pid, false)}
                      className={`text-[10px] p-1 border rounded cursor-pointer ${offer.partnerProperties.includes(pid) ? 'bg-egyptian-gold/20 border-egyptian-gold' : ''}`}
                    >
                      {allTiles[pid].name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600">
            {t('trade.cancel')}
          </button>
          <button
            onClick={() => onPropose(partnerId, offer)}
            className="px-4 py-2 text-sm font-bold bg-egyptian-gold text-white rounded shadow hover:bg-yellow-600"
          >
            {t('trade.proposeBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TradeModal
