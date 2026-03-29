import { useCallback } from 'react'
import { useGame } from '../context/GameContext'
import { detectAdBlock } from '../utils/adblock'

export function useAdBreak() {
  const { setIsAdblockDetected } = useGame()

  const showInterstitialAd = useCallback(
    async (onComplete: () => void) => {
      const isBlocked = await detectAdBlock()
      if (isBlocked) {
        console.warn('Adblocker detected.')
        setIsAdblockDetected(true)
        return
      }

      // If adBreak is not loaded or not configured, just proceed
      if (!window.adBreak) {
        console.warn('adBreak not found on window. Proceeding without ad.')
        onComplete()
        return
      }

      window.adBreak({
        type: 'start',
        name: 'lobby-transition',
        // For 'start' types, this is the only completion callback required
        adBreakDone: () => {
          console.log('Ad break finished. Resuming app flow.')
          onComplete()
        },
      })
    },
    [setIsAdblockDetected],
  )

  return { showInterstitialAd }
}
