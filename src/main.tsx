import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { GameProvider } from './context/GameContext'
import './i18n'

if (
  window.location.protocol === 'http:' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
) {
  window.location.replace(
    `https://${window.location.hostname}${window.location.pathname}${window.location.search}${window.location.hash}`,
  )
}

if (
  localStorage.theme === 'dark' ||
  (!('theme' in localStorage) && document.documentElement.classList.contains('dark'))
) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>,
)
