import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import en from '@/locales/en.json'
import es from '@/locales/es.json'
import ptBR from '@/locales/pt-BR.json'

// `<html lang>` follows the language on screen. index.html ships "pt-BR", and
// without this a visitor reading the English page still had it declared as
// Portuguese: screen readers pronounce it with the wrong voice, and it fails
// WCAG 3.1.1 while axe stays green, because axe only checks that the attribute
// is valid, not that it is true. Registered before init so the first
// resolution, from the browser's language, is covered too.
i18next.on('languageChanged', (language) => {
  document.documentElement.lang = i18next.resolvedLanguage ?? language
})

void i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: 'pt-BR',
    supportedLngs: ['pt-BR', 'en', 'es'],
    interpolation: { escapeValue: false },
    detection: {
      // `htmlTag` is left out on purpose, and its absence is the fix for every
      // English or Spanish browser opening in Portuguese. The detector's
      // default order ends with it, and index.html declares "pt-BR": i18next
      // takes the first *exact* match among everything detected, so "pt-BR"
      // from the HTML beat "en-US" from the browser before the fallback to
      // plain "en" was ever tried. Only browsers reporting exactly "en" or
      // "es" got their language. `<html lang>` is an output here (see the
      // listener above), never an input. The cookie lookup goes too: nothing
      // writes one.
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18next
