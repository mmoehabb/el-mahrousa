import React, { useState, useEffect, useRef } from 'react'
import type { Player, Tile, TradeOffer, GameAction } from '../types/game'
import { GAME_CONFIG } from '../config/gameConfig'
import { X, ArrowRightLeft, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type TabType = 'PROPOSE' | 'PENDING' | 'ACCEPTED' | 'REJECTED'

interface TradeModalProps {
  isOpen: boolean
  onClose: () => void
  players: Player[]
  myId: string
  allTiles: Tile[]
  trades: TradeOffer[]
  sendAction: (action: GameAction) => void
  initialTab?: TabType
}

const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  players,
  myId,
  allTiles,
  trades,
  sendAction,
  initialTab = 'PROPOSE',
}) => {
  const { t } = useTranslation()
  const me = players.find((p) => p.id === myId)
  const others = players.filter((p) => p.id !== myId)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const [activeTab, setActiveTab] = useState<TabType>('PROPOSE')
  const [partnerId, setPartnerId] = useState(others[0]?.id || '')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [offer, setOffer] = useState<TradeOffer>({
    myCash: 0,
    partnerCash: 0,
    myProperties: [],
    partnerProperties: [],
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
      // Set to initialTab when opening
      setTimeout(() => setActiveTab(initialTab), 0)
    }
  }, [isOpen, initialTab])

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
    const otherName = otherPlayer ? otherPlayer.name : t('trade.unknown')

    return (
      <div
        key={trade.id}
        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 fs-sm flex flex-col gap-4 shadow-sm"
      >
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
          <div className="font-bold text-egyptian-blue dark:text-egyptian-gold">
            {isSender ? t('trade.to', { name: otherName }) : t('trade.from', { name: otherName })}
          </div>
          <div className="fs-xs uppercase px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold">
            {t(`trade.status.${trade.status}`)}
          </div>
        </div>

        <div className="flex gap-4 justify-between items-center">
          <div className="flex-1 space-y-2">
            <div className="font-bold fs-xs text-slate-500 uppercase">{t('trade.youGive')}</div>
            <div className="font-bold">
              {GAME_CONFIG.CURRENCY} {isSender ? trade.myCash : trade.partnerCash}
            </div>
            <div className="fs-xs space-y-1">
              {(isSender ? trade.myProperties : trade.partnerProperties).map((pid) => (
                <div key={pid}>
                  • {t(`tiles.${allTiles[pid]?.name.toLowerCase().replace(/ /g, '-')}`)}
                </div>
              ))}
              {(isSender ? trade.myProperties : trade.partnerProperties).length === 0 && (
                <div className="italic text-slate-400">{t('trade.noProperties')}</div>
              )}
            </div>
          </div>

          <ArrowRightLeft className="text-slate-400" />

          <div className="flex-1 space-y-2 text-right">
            <div className="font-bold fs-xs text-slate-500 uppercase">{t('trade.youReceive')}</div>
            <div className="font-bold">
              {GAME_CONFIG.CURRENCY} {isSender ? trade.partnerCash : trade.myCash}
            </div>
            <div className="fs-xs space-y-1">
              {(isSender ? trade.partnerProperties : trade.myProperties).map((pid) => (
                <div key={pid}>
                  • {t(`tiles.${allTiles[pid]?.name.toLowerCase().replace(/ /g, '-')}`)}
                </div>
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
                className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white font-bold rounded fs-xs transition-colors"
              >
                {t('trade.cancelOffer')}
              </button>
            ) : (
              <>
                <button
                  onClick={() => sendAction({ type: 'REJECT_TRADE', tradeId: trade.id! })}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded fs-xs transition-colors"
                >
                  {t('trade.reject')}
                </button>
                <button
                  onClick={() => sendAction({ type: 'ACCEPT_TRADE', tradeId: trade.id! })}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded fs-xs transition-colors"
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
          {t('trade.noTradesFound', { status: t(`trade.tabs.${status}`).toLowerCase() })}
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
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-auto flex flex-col max-h-[90vh]"
      >
        <div className="bg-egyptian-blue text-white p-4 flex justify-between items-center">
          <h2 id="trade-modal-title" className="font-bold uppercase">
            {t('trade.title')}
          </h2>
          <button ref={closeButtonRef} onClick={onClose} aria-label={t('trade.cancel')}>
            <X />
          </button>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 fs-xs font-bold text-slate-600 dark:text-slate-300">
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
              {t(`trade.tabs.${tab}`)}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 min-h-[300px] flex flex-col">
          {activeTab === 'PROPOSE' ? (
            <>
              <div className="p-4 flex flex-col sm:flex-row gap-4 overflow-y-auto">
                {/* My side */}
                <div className="flex-1 space-y-4">
                  <div className="border-b pb-1 h-[42px] flex items-center">
                    <h3 className="font-bold fs-sm w-full">{t('trade.yourOffer')}</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="fs-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 block">
                      {GAME_CONFIG.CURRENCY}
                    </label>
                    <input
                      type="number"
                      className="w-full bg-white dark:bg-slate-800 border-2 border-egyptian-blue dark:border-egyptian-gold rounded p-2 fs-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-egyptian-gold transition-colors"
                      value={offer.myCash}
                      onChange={(e) =>
                        setOffer({ ...offer, myCash: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="fs-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 block">
                      {t('trade.properties')}
                    </label>
                    {me.properties.length === 0 ? (
                      <p className="fs-xs text-slate-400 dark:text-slate-500 italic">
                        {t('trade.noProperties')}
                      </p>
                    ) : (
                      me.properties.map((pid) => (
                        <div key={pid} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`my-property-${pid}`}
                            checked={offer.myProperties.includes(pid)}
                            onChange={() => toggleProperty(pid, true)}
                            className="appearance-none w-4 h-4 border-2 border-egyptian-blue dark:border-egyptian-gold rounded-sm checked:bg-egyptian-blue dark:checked:bg-egyptian-gold cursor-pointer transition-colors relative before:content-[''] before:absolute before:inset-0 before:bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%224%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3e%3cpolyline points=%2220 6 9 17 4 12%22%3e%3c/polyline%3e%3c/svg%3e')] before:bg-no-repeat before:bg-center before:bg-[length:80%_80%] before:opacity-0 checked:before:opacity-100"
                          />
                          <label htmlFor={`my-property-${pid}`} className="fs-2xs cursor-pointer">
                            {t(`tiles.${allTiles[pid].name.toLowerCase().replace(/ /g, '-')}`)}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center fs-2xl mx-4 rotate-90 sm:rotate-0">
                  ↔
                </div>

                {/* Partner side */}
                <div className="flex-1 space-y-4">
                  <div
                    className="border-b pb-1 relative h-[42px] flex items-center"
                    ref={dropdownRef}
                  >
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="w-full bg-white dark:bg-slate-800 border-2 border-egyptian-blue dark:border-egyptian-gold rounded p-2 fs-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-egyptian-gold transition-colors appearance-none cursor-pointer flex justify-between items-center h-[38px]"
                    >
                      <span>{partner?.name || t('trade.unknown')}</span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute top-full z-10 w-full mt-1 bg-white dark:bg-slate-800 border-2 border-egyptian-blue dark:border-egyptian-gold rounded shadow-lg max-h-48 overflow-auto font-bold fs-sm">
                        {others.map((o) => (
                          <div
                            key={o.id}
                            onClick={() => {
                              setPartnerId(o.id)
                              setOffer({ ...offer, partnerProperties: [], partnerCash: 0 })
                              setDropdownOpen(false)
                            }}
                            className={`p-2 cursor-pointer transition-colors ${
                              partnerId === o.id
                                ? 'bg-egyptian-blue text-white dark:bg-egyptian-gold dark:text-slate-900'
                                : 'hover:bg-egyptian-blue hover:text-white dark:hover:bg-egyptian-gold dark:hover:text-slate-900 text-slate-800 dark:text-white'
                            }`}
                          >
                            {o.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {partner && (
                    <>
                      <div className="space-y-2">
                        <label className="fs-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 block">
                          {GAME_CONFIG.CURRENCY}
                        </label>
                        <input
                          type="number"
                          className="w-full bg-white dark:bg-slate-800 border-2 border-egyptian-blue dark:border-egyptian-gold rounded p-2 fs-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-egyptian-gold transition-colors"
                          value={offer.partnerCash}
                          onChange={(e) =>
                            setOffer({ ...offer, partnerCash: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="fs-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 block">
                          {t('trade.properties')}
                        </label>
                        {partner.properties.length === 0 ? (
                          <p className="fs-xs text-slate-400 dark:text-slate-500 italic">
                            {t('trade.noProperties')}
                          </p>
                        ) : (
                          partner.properties.map((pid) => (
                            <div key={pid} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`partner-property-${pid}`}
                                checked={offer.partnerProperties.includes(pid)}
                                onChange={() => toggleProperty(pid, false)}
                                className="appearance-none w-4 h-4 border-2 border-egyptian-blue dark:border-egyptian-gold rounded-sm checked:bg-egyptian-blue dark:checked:bg-egyptian-gold cursor-pointer transition-colors relative before:content-[''] before:absolute before:inset-0 before:bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%224%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3e%3cpolyline points=%2220 6 9 17 4 12%22%3e%3c/polyline%3e%3c/svg%3e')] before:bg-no-repeat before:bg-center before:bg-[length:80%_80%] before:opacity-0 checked:before:opacity-100"
                              />
                              <label
                                htmlFor={`partner-property-${pid}`}
                                className="fs-2xs cursor-pointer"
                              >
                                {t(`tiles.${allTiles[pid].name.toLowerCase().replace(/ /g, '-')}`)}
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
                  className="px-4 py-2 fs-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded hover:border-egyptian-blue active:scale-95"
                >
                  {t('trade.cancel')}
                </button>
                <button
                  onClick={handlePropose}
                  disabled={others.length === 0 || offer.myCash > me.balance}
                  className="px-4 py-2 fs-sm font-bold bg-egyptian-gold text-white rounded shadow hover:bg-yellow-600 border-none disabled:opacity-50"
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
