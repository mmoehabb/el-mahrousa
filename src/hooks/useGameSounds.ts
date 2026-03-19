import { useMemo } from 'react'
import useSound from 'use-sound'
import { useGame } from '../context/GameContext'

export const useGameSounds = () => {
  const { isSfxEnabled } = useGame()
  const volume = 0.5

  const [playRoll] = useSound('/el-mahrousa/sounds/roll.mp3', { volume })
  const [playMove] = useSound('/el-mahrousa/sounds/move.mp3', { volume })
  const [playBuy] = useSound('/el-mahrousa/sounds/buy.mp3', { volume })
  const [playRent] = useSound('/el-mahrousa/sounds/rent.mp3', { volume })
  const [playJail] = useSound('/el-mahrousa/sounds/jail.mp3', { volume })
  const [playGo] = useSound('/el-mahrousa/sounds/go.mp3', { volume })
  const [playWin] = useSound('/el-mahrousa/sounds/win.mp3', { volume })
  const [playBankrupt] = useSound('/el-mahrousa/sounds/bankrupt.mp3', { volume })
  const [playClick] = useSound('/el-mahrousa/sounds/click.mp3', { volume: 0.2 })

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
