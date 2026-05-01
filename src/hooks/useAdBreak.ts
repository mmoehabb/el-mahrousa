import { useCallback } from 'react'
import { useGame } from '../context/GameContext'
import { detectAdBlock } from '../utils/adblock'
import { Capacitor } from '@capacitor/core'
import type { PluginListenerHandle } from '@capacitor/core'
import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob'
import type { AdMobInitializationOptions } from '@capacitor-community/admob'

let isAdMobInitialized = false

const initializeAdMob = async () => {
  if (isAdMobInitialized) return
  const options: AdMobInitializationOptions = {
    initializeForTesting: true,
  }
  await AdMob.initialize(options)
  isAdMobInitialized = true
}

export function useAdBreak() {
  const { setIsAdblockDetected } = useGame()

  const showInterstitialAd = useCallback(
    async (onComplete: () => void) => {
      // Handle native platform (Android)
      if (Capacitor.isNativePlatform()) {
        try {
          await initializeAdMob()

          // TODO: Replace test Ad IDs with production IDs before release
          const adId =
            Capacitor.getPlatform() === 'android'
              ? 'ca-app-pub-3940256099942544/1033173712' // Test Ad Unit ID for Interstitial
              : 'ca-app-pub-3940256099942544/4411468910' // Test Ad Unit ID for iOS (if needed)

          let hasCompleted = false
          const listeners: PluginListenerHandle[] = []
          const removeAllListeners = () => {
            listeners.forEach((listener) => listener.remove())
          }
          const completeOnce = () => {
            if (!hasCompleted) {
              hasCompleted = true
              removeAllListeners()
              onComplete()
            }
          }

          listeners.push(
            await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
              completeOnce()
            }),
          )

          listeners.push(
            await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
              completeOnce()
            }),
          )

          listeners.push(
            await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => {
              completeOnce()
            }),
          )

          await AdMob.prepareInterstitial({ adId, isTesting: true })
          await AdMob.showInterstitial()
          return
        } catch (error) {
          console.error('Error showing AdMob interstitial:', error)
          // If prepareInterstitial throws, ensure we still complete the app flow
          let hasCompleted = false
          const completeOnceCatch = () => {
            if (!hasCompleted) {
              hasCompleted = true
              onComplete()
            }
          }
          completeOnceCatch()
          return
        }
      }

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
