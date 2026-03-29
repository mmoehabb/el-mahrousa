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

      let hasCompleted = false
      const completeOnce = () => {
        if (!hasCompleted) {
          hasCompleted = true
          onComplete()
        }
      }

      // Fallback in case the ad system fails silently
      const timeoutId = setTimeout(() => {
        console.warn('Ad break timeout reached. Resuming app flow.')
        completeOnce()
      }, 2000)

      try {
        window.adBreak({
          type: 'start',
          name: 'lobby-transition',
          // For 'start' types, this is the only completion callback required
          adBreakDone: () => {
            console.log('Ad break finished. Resuming app flow.')
            clearTimeout(timeoutId)
            completeOnce()
          },
        })
      } catch (error) {
        console.error('Error starting ad break:', error)
        clearTimeout(timeoutId)
        completeOnce()
      }
    },
    [setIsAdblockDetected],
  )

  return { showInterstitialAd }
}
