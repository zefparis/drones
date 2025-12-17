import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './en.json'
import fr from './fr.json'

export const LANGUAGE_STORAGE_KEY = 'celestial-lang'

function getInitialLanguage(): 'en' | 'fr' {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored === 'fr') return 'fr'
  return 'en'
}

const initialLanguage = getInitialLanguage()

document.documentElement.lang = initialLanguage

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
