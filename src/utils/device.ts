import { Capacitor } from '@capacitor/core'

export const isAndroidWeb = (): boolean => {
  return /android/i.test(navigator.userAgent) && !Capacitor.isNativePlatform()
}
