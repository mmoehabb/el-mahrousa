import React, { useState, useEffect, useRef } from 'react'
import type { Player, Tile, TradeOffer } from '../types/game'
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
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const [partnerId, setPartnerId] = useState(others[0]?.id || '')
  const [offer, setOffer] = useState<TradeOffer>({
    myCash: 0,
    partnerCash: 0,
    myProperties: [],
    partnerProperties: [],
  })

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

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
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-egyptian-blue text-white p-4 flex justify-between items-center">
          <h2 id="trade-modal-title" className="font-bold uppercase">
            {t('trade.title')}
          </h2>
          <button ref={closeButtonRef} onClick={onClose} aria-label={t('trade.cancel')}>
            <X />
          </button>
        </div>

        <div className="p-4 flex gap-4 overflow-y-auto">
          {/* My side */}
          <div className="flex-1 space-y-4">
            <h3 className="font-bold border-b pb-1 text-sm">{t('trade.yourOffer')}</h3>
            <div className="space-y-2">
              <label className="text-xs text-slate-500 block">{GAME_CONFIG.CURRENCY}</label>
              <input
                type="number"
                className="w-full border border-slate-200 rounded p-1 text-sm focus:border-egyptian-blue focus:border-2"
                value={offer.myCash}
                onChange={(e) => setOffer({ ...offer, myCash: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500 block">{t('trade.properties')}</label>
              {me.properties.length === 0 ? (
                <p className="text-xs text-slate-400 italic">{t('trade.noProperties')}</p>
              ) : (
                me.properties.map((pid) => (
                  <div key={pid} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`my-property-${pid}`}
                      checked={offer.myProperties.includes(pid)}
                      onChange={(e) => toggleProperty(pid, e.target.checked)}
                      className="w-3 h-3 text-egyptian-gold focus:ring-2 focus:ring-egyptian-gold"
                    />
                    <label htmlFor={`my-property-${pid}`} className="text-[10px] cursor-pointer">
                      {allTiles[pid].name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-center text-2xl mx-4">↔</div>

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
                  <label className="text-xs text-slate-500 block">{GAME_CONFIG.CURRENCY}</label>
                  <input
                    type="number"
                    className="w-full border border-slate-200 rounded p-1 text-sm focus:border-egyptian-blue focus:border-2"
                    value={offer.partnerCash}
                    onChange={(e) =>
                      setOffer({ ...offer, partnerCash: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 block">{t('trade.properties')}</label>
                  {partner.properties.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">{t('trade.noProperties')}</p>
                  ) : (
                    partner.properties.map((pid) => (
                      <div key={pid} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`partner-property-${pid}`}
                          checked={offer.partnerProperties.includes(pid)}
                          onChange={(e) => toggleProperty(pid, e.target.checked)}
                          className="w-3 h-3 text-egyptian-gold focus:ring-2 focus:ring-egyptian-gold"
                        />
                        <label
                          htmlFor={`partner-property-${pid}`}
                          className="text-[10px] cursor-pointer"
                        >
                          {allTiles[pid].name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded hover:border-egyptian-blue active:scale-95"
          >
            {t('trade.cancel')}
          </button>
          <button
            onClick={() => onPropose(partnerId, offer)}
            className="px-4 py-2 text-sm font-bold bg-egyptian-gold text-white rounded shadow hover:bg-yellow-600 border-none"
          >
            {t('trade.proposeBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TradeModal
