import { afterEach, describe, expect, it, vi } from 'vitest'

import i18n from './i18n'

describe('i18n', () => {
  afterEach(async () => {
    await i18n.changeLanguage('pt-BR')
  })

  it('keeps <html lang> in step with the language on screen', async () => {
    await i18n.changeLanguage('en')
    expect(document.documentElement.lang).toBe('en')

    await i18n.changeLanguage('es')
    expect(document.documentElement.lang).toBe('es')

    await i18n.changeLanguage('pt-BR')
    expect(document.documentElement.lang).toBe('pt-BR')
  })
})

describe('i18n language detection on a first visit', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
    window.localStorage.removeItem('i18nextLng')
    document.documentElement.lang = 'pt-BR'
  })

  // A fresh module and a fresh i18next instance, as on a first page load: what
  // the detector finds with nothing stored yet, under index.html's lang="pt-BR".
  async function firstVisitWith(languages: string[]) {
    window.localStorage.removeItem('i18nextLng')
    document.documentElement.lang = 'pt-BR'
    vi.stubGlobal('navigator', { ...window.navigator, language: languages[0], languages })
    vi.resetModules()
    const { default: fresh } = await import('./i18n')
    if (!fresh.isInitialized) await new Promise((resolve) => fresh.on('initialized', resolve))
    return fresh.resolvedLanguage
  }

  // Only 'en-US', no plain 'en' after it: that is what a browser reports when the
  // user picked one regional English, and it is the case the HTML's lang beat.
  it('opens in English for a browser set to en-US, not in the HTML’s Portuguese', async () => {
    expect(await firstVisitWith(['en-US'])).toBe('en')
  })

  it('opens in Spanish for a browser set to es-ES', async () => {
    expect(await firstVisitWith(['es-ES'])).toBe('es')
  })

  it('falls back to Portuguese for a language the app does not have', async () => {
    expect(await firstVisitWith(['fr-FR'])).toBe('pt-BR')
  })
})
