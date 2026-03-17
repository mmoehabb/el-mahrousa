import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enTranslation from './locales/en.json'
import arTranslation from './locales/ar.json'

const savedLanguage = localStorage.getItem('appLanguage') || 'en'
document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr'

// Update font class based on language
document.body.className = savedLanguage === 'ar' ? 'font-arabic-pixel' : 'font-english-pixel'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    ar: { translation: arTranslation },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('appLanguage', lng)
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
  document.body.className = lng === 'ar' ? 'font-arabic-pixel' : 'font-english-pixel'
})

export default i18n
