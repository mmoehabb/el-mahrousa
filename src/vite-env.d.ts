/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface Window {
  adsbygoogle?: unknown[]
  adConfig?: (config: { preloadAdBreaks: string; sound?: string; onReady?: () => void }) => void
  adBreak?: (config: {
    type: string
    name: string
    adBreakDone?: (info?: { breakType: string; breakName: string }) => void
    adDismissed?: () => void
    adViewed?: () => void
    adError?: (error: string, code: number) => void
  }) => void
}

interface ImportMetaEnv {
  readonly VITE_ADSENSE_PUB_ID: string
  readonly VITE_IS_PROD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
