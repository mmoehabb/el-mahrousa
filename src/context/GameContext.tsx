import React, { createContext, useContext, useState, useEffect } from 'react'
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
  avatarName: string
  setAvatarName: (name: string) => void
  isSfxEnabled: boolean
  setIsSfxEnabled: (enabled: boolean) => void
  isBgmEnabled: boolean
  setIsBgmEnabled: (enabled: boolean) => void
  sfxVolume: number
  setSfxVolume: (volume: number) => void
  bgmVolume: number
  setBgmVolume: (volume: number) => void
  iceServers: string[]
  setIceServers: (servers: string[]) => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(createInitialState())
  const [isHost, setIsHost] = useState(false)
  const [myId] = useState(() => {
    const storedId = localStorage.getItem('playerId')
    if (storedId) return storedId
    const newId = crypto.randomUUID()
    localStorage.setItem('playerId', newId)
    return newId
  })
  const [playerName, setPlayerName] = useState(() => sessionStorage.getItem('playerName') || '')
  const [avatarName, setAvatarName] = useState(
    () => sessionStorage.getItem('avatarName') || 'merchant',
  )

  // Audio settings
  const [isSfxEnabled, setIsSfxEnabled] = useState(() => {
    const stored = localStorage.getItem('isSfxEnabled')
    return stored ? JSON.parse(stored) : true
  })
  const [isBgmEnabled, setIsBgmEnabled] = useState(() => {
    const stored = localStorage.getItem('isBgmEnabled')
    return stored ? JSON.parse(stored) : true
  })
  const [sfxVolume, setSfxVolumeState] = useState(() => {
    const stored = localStorage.getItem('sfxVolume')
    return stored ? JSON.parse(stored) : 0.5
  })
  const [bgmVolume, setBgmVolumeState] = useState(() => {
    const stored = localStorage.getItem('bgmVolume')
    return stored ? JSON.parse(stored) : 0.3
  })
  const [iceServers, setIceServersState] = useState<string[]>(() => {
    const stored = localStorage.getItem('iceServers')
    return stored ? JSON.parse(stored) : []
  })

  const handleSetPlayerName = (name: string) => {
    setPlayerName(name)
    sessionStorage.setItem('playerName', name)
  }

  const handleSetAvatarName = (name: string) => {
    setAvatarName(name)
    sessionStorage.setItem('avatarName', name)
  }

  const handleSetSfxEnabled = (enabled: boolean) => {
    setIsSfxEnabled(enabled)
    localStorage.setItem('isSfxEnabled', JSON.stringify(enabled))
  }

  const handleSetBgmEnabled = (enabled: boolean) => {
    setIsBgmEnabled(enabled)
    localStorage.setItem('isBgmEnabled', JSON.stringify(enabled))
  }

  const handleSetSfxVolume = (volume: number) => {
    setSfxVolumeState(volume)
    localStorage.setItem('sfxVolume', JSON.stringify(volume))
  }

  const handleSetBgmVolume = (volume: number) => {
    setBgmVolumeState(volume)
    localStorage.setItem('bgmVolume', JSON.stringify(volume))
  }

  const handleSetIceServers = (servers: string[]) => {
    setIceServersState(servers)
    localStorage.setItem('iceServers', JSON.stringify(servers))
  }

  useEffect(() => {
    // Initialize adConfig when component mounts
    if (window.adConfig) {
      window.adConfig({
        preloadAdBreaks: 'on',
        sound: 'on',
      })
    }
  }, [])

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
        avatarName,
        setAvatarName: handleSetAvatarName,
        isSfxEnabled,
        setIsSfxEnabled: handleSetSfxEnabled,
        isBgmEnabled,
        setIsBgmEnabled: handleSetBgmEnabled,
        sfxVolume,
        setSfxVolume: handleSetSfxVolume,
        bgmVolume,
        setBgmVolume: handleSetBgmVolume,
        iceServers,
        setIceServers: handleSetIceServers,
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
