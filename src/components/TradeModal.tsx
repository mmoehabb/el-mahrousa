import React, { useState, useEffect, useRef } from 'react'
import type { Player, Tile, TradeOffer, GameAction } from '../types/game'
import { GAME_CONFIG } from '../config/gameConfig'
import { X, ArrowRightLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface TradeModalProps {
  isOpen: boolean
  onClose: () => void
  players: Player[]
  myId: string
  allTiles: Tile[]
  trades: TradeOffer[]
  sendAction: (action: GameAction) => void
}

type TabType = 'PROPOSE' | 'PENDING' | 'ACCEPTED' | 'REJECTED'

const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  players,
  myId,
  allTiles,
  trades,
  sendAction,
}) => {
  const { t } = useTranslation()
  const me = players.find((p) => p.id === myId)
  const others = players.filter((p) => p.id !== myId)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const [activeTab, setActiveTab] = useState<TabType>('PROPOSE')
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
      // Reset propose tab when opening
      setTimeout(() => setActiveTab('PROPOSE'), 0)
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

  const handlePropose = () => {
    sendAction({ type: 'PROPOSE_TRADE', partnerId, offer })
    setActiveTab('PENDING')
    setOffer({
      myCash: 0,
      partnerCash: 0,
      myProperties: [],
      partnerProperties: [],
    })
  }

  const myTrades = (trades || []).filter((t) => t.fromId === myId || t.toId === myId)

  const renderTradeCard = (trade: TradeOffer) => {
    const isSender = trade.fromId === myId
    const otherId = isSender ? trade.toId : trade.fromId
    const otherPlayer = players.find((p) => p.id === otherId)
    const otherName = otherPlayer ? otherPlayer.name : 'Unknown'

    return (
      <div
        key={trade.id}
        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-sm flex flex-col gap-4 shadow-sm"
      >
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
          <div className="font-bold text-egyptian-blue dark:text-egyptian-gold">
            {isSender ? `To: ${otherName}` : `From: ${otherName}`}
          </div>
          <div className="text-xs uppercase px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold">
            {trade.status}
          </div>
        </div>

        <div className="flex gap-4 justify-between items-center">
          <div className="flex-1 space-y-2">
            <div className="font-bold text-xs text-slate-500 uppercase">{t('trade.youGive')}</div>
            <div className="font-bold">
              {GAME_CONFIG.CURRENCY} {isSender ? trade.myCash : trade.partnerCash}
            </div>
            <div className="text-xs space-y-1">
              {(isSender ? trade.myProperties : trade.partnerProperties).map((pid) => (
                <div key={pid}>• {allTiles[pid]?.name}</div>
              ))}
              {(isSender ? trade.myProperties : trade.partnerProperties).length === 0 && (
                <div className="italic text-slate-400">{t('trade.noProperties')}</div>
              )}
            </div>
          </div>

          <ArrowRightLeft className="text-slate-400" />

          <div className="flex-1 space-y-2 text-right">
            <div className="font-bold text-xs text-slate-500 uppercase">
              {t('trade.youReceive')}
            </div>
            <div className="font-bold">
              {GAME_CONFIG.CURRENCY} {isSender ? trade.partnerCash : trade.myCash}
            </div>
            <div className="text-xs space-y-1">
              {(isSender ? trade.partnerProperties : trade.myProperties).map((pid) => (
                <div key={pid}>• {allTiles[pid]?.name}</div>
              ))}
              {(isSender ? trade.partnerProperties : trade.myProperties).length === 0 && (
                <div className="italic text-slate-400">{t('trade.noProperties')}</div>
              )}
            </div>
          </div>
        </div>

        {trade.status === 'PENDING' && (
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
            {isSender ? (
              <button
                onClick={() => sendAction({ type: 'CANCEL_TRADE', tradeId: trade.id! })}
                className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white font-bold rounded text-xs transition-colors"
              >
                {t('trade.cancelOffer')}
              </button>
            ) : (
              <>
                <button
                  onClick={() => sendAction({ type: 'REJECT_TRADE', tradeId: trade.id! })}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs transition-colors"
                >
                  {t('trade.reject')}
                </button>
                <button
                  onClick={() => sendAction({ type: 'ACCEPT_TRADE', tradeId: trade.id! })}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-xs transition-colors"
                >
                  {t('trade.acceptOffer')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderList = (status: TabType) => {
    const list = myTrades.filter((t) => t.status === status)
    if (list.length === 0) {
      return (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400 italic">
          No {status.toLowerCase()} trades found.
        </div>
      )
    }
    return <div className="p-4 space-y-4">{list.map(renderTradeCard)}</div>
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
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-egyptian-blue text-white p-4 flex justify-between items-center">
          <h2 id="trade-modal-title" className="font-bold uppercase">
            {t('trade.title')}
          </h2>
          <button ref={closeButtonRef} onClick={onClose} aria-label={t('trade.cancel')}>
            <X />
          </button>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
          {(['PROPOSE', 'PENDING', 'ACCEPTED', 'REJECTED'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 uppercase transition-colors ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-900 border-b-2 border-egyptian-gold text-egyptian-gold'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 min-h-[300px] flex flex-col">
          {activeTab === 'PROPOSE' ? (
            <>
              <div className="p-4 flex gap-4">
                {/* My side */}
                <div className="flex-1 space-y-4">
                  <h3 className="font-bold border-b pb-1 text-sm">{t('trade.yourOffer')}</h3>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 block">
                      {GAME_CONFIG.CURRENCY}
                    </label>
                    <input
                      type="number"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded p-1 text-sm focus:border-egyptian-blue focus:border-2"
                      value={offer.myCash}
                      onChange={(e) =>
                        setOffer({ ...offer, myCash: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 block">
                      {t('trade.properties')}
                    </label>
                    {me.properties.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                        {t('trade.noProperties')}
                      </p>
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
                          <label
                            htmlFor={`my-property-${pid}`}
                            className="text-[10px] cursor-pointer"
                          >
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
                        <label className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 block">
                          {GAME_CONFIG.CURRENCY}
                        </label>
                        <input
                          type="number"
                          className="w-full border border-slate-200 dark:border-slate-700 rounded p-1 text-sm focus:border-egyptian-blue focus:border-2"
                          value={offer.partnerCash}
                          onChange={(e) =>
                            setOffer({ ...offer, partnerCash: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 block">
                          {t('trade.properties')}
                        </label>
                        {partner.properties.length === 0 ? (
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                            {t('trade.noProperties')}
                          </p>
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

              <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t flex justify-end gap-2 mt-auto">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded hover:border-egyptian-blue active:scale-95"
                >
                  {t('trade.cancel')}
                </button>
                <button
                  onClick={handlePropose}
                  disabled={others.length === 0}
                  className="px-4 py-2 text-sm font-bold bg-egyptian-gold text-white rounded shadow hover:bg-yellow-600 border-none disabled:opacity-50"
                >
                  {t('trade.proposeBtn')}
                </button>
              </div>
            </>
          ) : (
            renderList(activeTab)
          )}
        </div>
      </div>
    </div>
  )
}

export default TradeModal
