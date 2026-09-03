import { describe, expect, it } from 'vitest'

import { formatDayMonthParts } from './date'

/**
 * Os dois pedaços do bloco de data das consultas.
 *
 * A tentação, ao escrever esse bloco, é fatiar o resultado de
 * `formatDateDisplay`: em pt-BR "10/09/2026" começa com o dia, então
 * `slice(0, 2)` "funciona". Em `en` a mesma string é "09/10/2026" e o bloco
 * passa a anunciar o mês como se fosse o dia — silenciosamente, e só para quem
 * trocou de idioma. Daí o `Intl` decidir cada pedaço.
 */
describe('formatDayMonthParts', () => {
  it('devolve dia e mês abreviado em pt-BR', () => {
    expect(formatDayMonthParts('2026-09-10', 'pt-BR')).toEqual({ day: '10', month: 'set' })
  })

  it('não confunde dia com mês em en, onde a ordem da data é outra', () => {
    // A data é 10 de setembro. Em `en` a data completa sai "09/10/2026", que
    // fatiada daria "09" — o mês.
    expect(formatDayMonthParts('2026-09-10', 'en')).toEqual({ day: '10', month: 'Sep' })
  })

  it('devolve dia e mês abreviado em es', () => {
    expect(formatDayMonthParts('2026-09-10', 'es')).toEqual({ day: '10', month: 'sept' })
  })

  /** O ponto que o pt-BR acrescenta é ruído numa caixa de 10px que já é rótulo. */
  it('tira o ponto final do mês abreviado', () => {
    expect(formatDayMonthParts('2026-01-05', 'pt-BR').month).not.toMatch(/\.$/)
  })

  it('mantém o zero à esquerda no dia, que é o que alinha a caixa', () => {
    expect(formatDayMonthParts('2026-01-05', 'pt-BR').day).toBe('05')
  })
})
