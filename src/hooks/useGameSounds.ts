import { useMemo } from 'react'
import useSound from 'use-sound'
import { useGame } from '../context/GameContext'

export const useGameSounds = () => {
  const { isSfxEnabled } = useGame()
  const volume = 0.5

  const [playRoll] = useSound('/sounds/roll.mp3', { volume })
  const [playMove] = useSound('/sounds/move.mp3', { volume })
  const [playBuy] = useSound('/sounds/buy.mp3', { volume })
  const [playRent] = useSound('/sounds/rent.mp3', { volume })
  const [playJail] = useSound('/sounds/jail.mp3', { volume })
  const [playGo] = useSound('/sounds/go.mp3', { volume })
  const [playWin] = useSound('/sounds/win.mp3', { volume })
  const [playBankrupt] = useSound('/sounds/bankrupt.mp3', { volume })
  const [playClick] = useSound('/sounds/click.mp3', { volume: 0.2 })

  return useMemo(() => {
    const playSound = (soundFn: () => void) => {
      if (isSfxEnabled) {
        soundFn()
      }
    }

    return {
      playRoll: () => playSound(playRoll),
      playMove: () => playSound(playMove),
      playBuy: () => playSound(playBuy),
      playRent: () => playSound(playRent),
      playJail: () => playSound(playJail),
      playGo: () => playSound(playGo),
      playWin: () => playSound(playWin),
      playBankrupt: () => playSound(playBankrupt),
      playClick: () => playSound(playClick),
    }
  }, [
    isSfxEnabled,
    playRoll,
    playMove,
    playBuy,
    playRent,
    playJail,
    playGo,
    playWin,
    playBankrupt,
    playClick,
  ])
}
