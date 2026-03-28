import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import packageJson from './package.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    'import.meta.env.VITE_ADSENSE_PUB_ID': JSON.stringify(process.env.VITE_ADSENSE_PUB_ID || ''),
  },
  server: {
    port: 3000,
    strictPort: true,
  },
})
