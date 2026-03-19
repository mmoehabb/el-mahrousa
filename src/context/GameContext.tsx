import React, { createContext, useContext, useState } from 'react'
import type { GameState } from '../types/game'
import { createInitialState } from '../logic/gameLogic'

interface GameContextType {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
  isHost: boolean
  setIsHost: (isHost: boolean) => void
  myId: string
  playerName: string
  setPlayerName: (name: string) => void
  isSfxEnabled: boolean
  setIsSfxEnabled: (enabled: boolean) => void
  isBgmEnabled: boolean
  setIsBgmEnabled: (enabled: boolean) => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(createInitialState())
  const [isHost, setIsHost] = useState(false)
  const [myId] = useState(() => crypto.randomUUID())
  const [playerName, setPlayerName] = useState(() => sessionStorage.getItem('playerName') || '')

  // Audio settings
  const [isSfxEnabled, setIsSfxEnabled] = useState(() => {
    const stored = localStorage.getItem('isSfxEnabled')
    return stored ? JSON.parse(stored) : true
  })
  const [isBgmEnabled, setIsBgmEnabled] = useState(() => {
    const stored = localStorage.getItem('isBgmEnabled')
    return stored ? JSON.parse(stored) : true
  })

  const handleSetPlayerName = (name: string) => {
    setPlayerName(name)
    sessionStorage.setItem('playerName', name)
  }

  const handleSetSfxEnabled = (enabled: boolean) => {
    setIsSfxEnabled(enabled)
    localStorage.setItem('isSfxEnabled', JSON.stringify(enabled))
  }

  const handleSetBgmEnabled = (enabled: boolean) => {
    setIsBgmEnabled(enabled)
    localStorage.setItem('isBgmEnabled', JSON.stringify(enabled))
  }

  return (
    <GameContext.Provider
      value={{
        gameState,
        setGameState,
        isHost,
        setIsHost,
        myId,
        playerName,
        setPlayerName: handleSetPlayerName,
        isSfxEnabled,
        setIsSfxEnabled: handleSetSfxEnabled,
        isBgmEnabled,
        setIsBgmEnabled: handleSetBgmEnabled,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame must be used within a GameProvider')
  return context
}
