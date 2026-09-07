import { describe, expect, it } from 'vitest'

import { ageInMonthsAt, ageInMonthsExactAt, formatDayMonthParts } from './date'

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

describe('ageInMonthsAt', () => {
  it('conta meses completos, não iniciados', () => {
    // Um dia antes do aniversário de mês, a criança ainda tem a idade anterior.
    expect(ageInMonthsAt('2026-01-15', new Date(2026, 2, 14))).toBe(1)
    expect(ageInMonthsAt('2026-01-15', new Date(2026, 2, 15))).toBe(2)
  })

  /**
   * `new Date('2026-01-15')` é meia-noite **UTC**, e todo leitor daqui pede
   * componente local: em fuso negativo esse Date responde dia 14. A idade
   * virava um dia antes, todo mês, em silêncio — só aparece no dia da virada.
   */
  it('lê a data de nascimento como data de calendário, não como instante UTC', () => {
    // Véspera do aniversário de mês no fuso local. Com o parse UTC isto dava 2.
    expect(ageInMonthsAt('2026-01-15', new Date(2026, 1, 14))).toBe(0)
    expect(ageInMonthsAt('2026-01-15', new Date(2026, 1, 15))).toBe(1)
  })

  it('não devolve idade negativa para data anterior ao nascimento', () => {
    // Consulta agendada antes do nascimento é dado impossível, mas o eixo de um
    // gráfico não deve receber -3 e desenhar para fora da área.
    expect(ageInMonthsAt('2026-01-15', new Date(2025, 9, 1))).toBe(0)
  })
})

/**
 * As duas funções discordam de propósito: a exata é a coordenada, a de meses
 * completos é o rótulo. Confundi-las empilha pontos em cima uns dos outros.
 */
describe('ageInMonthsExactAt', () => {
  it('separa duas visitas dentro do mesmo mês de vida', () => {
    const primeira = ageInMonthsExactAt('2026-01-01', new Date(2026, 0, 8))
    const segunda = ageInMonthsExactAt('2026-01-01', new Date(2026, 0, 29))

    // Ambas dariam 0 em meses completos — e o gráfico desenharia uma linha
    // vertical justo na idade em que a curva mais sobe.
    expect(ageInMonthsAt('2026-01-01', new Date(2026, 0, 8))).toBe(0)
    expect(ageInMonthsAt('2026-01-01', new Date(2026, 0, 29))).toBe(0)
    expect(segunda - primeira).toBeGreaterThan(0.6)
  })

  it('fica a menos de um mês da contagem de meses completos', () => {
    const at = new Date(2027, 5, 20)
    const exata = ageInMonthsExactAt('2026-01-15', at)
    const inteira = ageInMonthsAt('2026-01-15', at)

    expect(exata - inteira).toBeGreaterThanOrEqual(0)
    expect(exata - inteira).toBeLessThan(1)
  })
})
