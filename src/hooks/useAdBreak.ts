import { useCallback } from 'react'

export function useAdBreak() {
  const showInterstitialAd = useCallback((onComplete: () => void) => {
    // If adBreak is not loaded or not configured, just proceed
    if (!window.adBreak) {
      console.warn('adBreak not found on window. Proceeding without ad.')
      onComplete()
      return
    }

    window.adBreak({
      type: 'interstitial',
      name: 'lobby-transition',
      adBreakDone: () => {
        console.log('Ad break done (completed, skipped, or no fill)')
        onComplete()
      },
      adDismissed: () => {
        console.log('Ad dismissed')
      },
      adViewed: () => {
        console.log('Ad viewed')
      },
    })
  }, [])

  return { showInterstitialAd }
}
