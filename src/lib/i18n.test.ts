import { afterEach, describe, expect, it } from 'vitest'

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
