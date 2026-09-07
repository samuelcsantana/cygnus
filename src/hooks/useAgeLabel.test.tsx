import { renderHook } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { beforeAll, describe, expect, it, vi, afterEach } from 'vitest'

import i18n from '@/lib/i18n'

import { useAgeLabel } from './useAgeLabel'

function labelFor(birthDate: string): string {
  const { result } = renderHook(() => useAgeLabel(), {
    wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
  })
  return result.current(birthDate)
}

// O `navigator.language` do jsdom é "en-US" e o detector do i18next ganha do
// fallback — o mesmo motivo pelo qual o `test-utils` fixa o idioma. Aqui o
// provider é montado à mão, então a fixação também tem de ser.
beforeAll(async () => {
  await i18n.changeLanguage('pt-BR')
})

afterEach(() => {
  vi.useRealTimers()
})

/** Data fixa, porque "quantos meses" depende de hoje. */
function today(date: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(`${date}T12:00:00`))
}

describe('useAgeLabel', () => {
  it('conta em meses antes dos dois anos, que é como se fala', () => {
    today('2026-04-15')
    expect(labelFor('2026-01-15')).toBe('3 meses')
    expect(labelFor('2026-03-15')).toBe('1 mês')
  })

  it('vira anos aos dois, que é onde as pessoas param de contar mês', () => {
    today('2026-04-15')
    expect(labelFor('2024-04-15')).toBe('2 anos')
    // 23 meses ainda é mês.
    expect(labelFor('2024-05-15')).toBe('23 meses')
  })

  it('diz os meses que sobram, e cala quando não sobra nenhum', () => {
    today('2026-04-15')
    expect(labelFor('2020-10-15')).toBe('5 anos e 6 meses')
    // No aniversário não existe "5 anos e 0 meses".
    expect(labelFor('2021-04-15')).toBe('5 anos')
  })

  /**
   * Duas coisas ao mesmo tempo: idade nunca é negativa, e **zero é plural em
   * português** — "0 mês" está errado. A regra do CLDR para pt trata 0 como
   * singular, então a forma `_zero` existe para desmentir isso. O `monthsOld`
   * antigo já carregava a mesma correção.
   */
  it('não devolve idade negativa, e diz "0 meses" e não "0 mês"', () => {
    today('2026-04-15')
    expect(labelFor('2027-01-01')).toBe('0 meses')
  })
})
