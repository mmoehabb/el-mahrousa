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
      type: 'start',
      name: 'lobby-transition',
      // For 'start' types, this is the only completion callback required
      adBreakDone: () => {
        console.log('Ad break finished. Resuming app flow.')
        onComplete()
      },
    })
  }, [])

  return { showInterstitialAd }
}
