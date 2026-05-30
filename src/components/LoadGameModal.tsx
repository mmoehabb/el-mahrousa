import React, { useState, useEffect, useCallback } from 'react'
import { X, Download, Upload, Play } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GameState } from '../types/game'

interface LoadGameModalProps {
  isOpen: boolean
  onClose: () => void
  onLoad: (state: GameState) => void
}

interface SaveSlot {
  key: string
  label: string
  date: Date
  state: GameState
}

const LoadGameModal: React.FC<LoadGameModalProps> = ({ isOpen, onClose, onLoad }) => {
  const [slots, setSlots] = useState<SaveSlot[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadSlots = useCallback(() => {
    const loadedSlots: SaveSlot[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('monopoly_save_')) {
        try {
          const item = localStorage.getItem(key)
          if (item) {
            const state = JSON.parse(item) as GameState
            const isAuto = key === 'monopoly_save_auto'
            // Attempt to extract timestamp from key if it's not auto
            let date = new Date()
            if (!isAuto) {
              const timestampStr = key.replace('monopoly_save_', '')
              const parsedDate = new Date(parseInt(timestampStr, 10))
              if (!isNaN(parsedDate.getTime())) {
                date = parsedDate
              }
            } else if (state.lastLoadedAt) {
              date = new Date(state.lastLoadedAt)
            }

            loadedSlots.push({
              key,
              label: isAuto ? 'Auto-save' : `Save ${date.toLocaleString()}`,
              date,
              state
            })
          }
        } catch (e) {
          console.error('Failed to parse save slot', key, e)
        }
      }
    }

    // Sort so auto-save is first, then by date descending
    loadedSlots.sort((a, b) => {
      if (a.key === 'monopoly_save_auto') return -1
      if (b.key === 'monopoly_save_auto') return 1
      return b.date.getTime() - a.date.getTime()
    })

    setSlots(loadedSlots)
  }, [])

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadSlots()
    } else {
      setErrorMsg(null)
    }
  }, [isOpen, loadSlots])

  const handleDownload = (slot: SaveSlot) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(slot.state))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute('href', dataStr)
    downloadAnchorNode.setAttribute('download', `${slot.key}.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const loadedState = JSON.parse(e.target?.result as string)
        if (loadedState && loadedState.players) {
          const newKey = `monopoly_save_${Date.now()}`
          localStorage.setItem(newKey, JSON.stringify(loadedState))
          loadSlots()
        } else {
          setErrorMsg('Invalid save file format.')
        }
      } catch {
        setErrorMsg('Error parsing save file.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-slate-900 border-4 border-egyptian-gold rounded-xl p-6 max-w-lg w-full shadow-2xl relative max-h-[80vh] flex flex-col"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <h2 className="text-2xl font-bold text-white mb-6 text-center uppercase tracking-widest text-egyptian-gold">
            Load Game
          </h2>

          {errorMsg && (
            <div className="bg-red-500/20 text-red-200 p-2 mb-4 rounded border border-red-500 text-center text-sm">
              {errorMsg}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-6">
            {slots.length === 0 ? (
              <div className="text-center text-slate-400 py-8">No saved games found.</div>
            ) : (
              slots.map((slot) => (
                <div
                  key={slot.key}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{slot.label}</div>
                    <div className="text-xs text-slate-400">
                      {slot.state.players?.length || 0} players | Turn {slot.state.turnPhase}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(slot)}
                      className="p-2 bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white rounded transition-colors"
                      title="Download JSON"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => onLoad(slot.state)}
                      className="flex items-center gap-1 px-3 py-2 bg-egyptian-blue hover:bg-blue-600 text-white font-bold rounded transition-colors"
                    >
                      <Play size={16} /> Load
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-slate-700 flex justify-center">
            <label className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold cursor-pointer transition-colors">
              <Upload size={18} /> Upload Save File (.json)
              <input type="file" accept=".json" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default LoadGameModal
