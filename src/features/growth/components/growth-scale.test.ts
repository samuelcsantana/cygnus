import { describe, expect, it } from 'vitest'

import { niceScale, positionIn } from './growth-scale'

describe('niceScale', () => {
  it('escolhe limites e passo que uma pessoa escolheria', () => {
    // 5,4 a 15,8 divididos em quatro partes iguais dariam 8,0 / 10,6 / 13,2 —
    // aritmeticamente certo e ilegível. O passo sobe para 5 e os limites caem
    // em cima dele; sobra espaço vazio nas pontas, que é o preço combinado.
    const scale = niceScale(5.4, 15.8)

    expect(scale.min).toBe(5)
    expect(scale.max).toBe(20)
    expect(scale.ticks).toEqual([5, 10, 15, 20])
  })

  it('contém a faixa inteira dos dados', () => {
    const scale = niceScale(0.34, 97.2)

    expect(scale.min).toBeLessThanOrEqual(0.34)
    expect(scale.max).toBeGreaterThanOrEqual(97.2)
  })

  /**
   * Uma criança com uma consulta medida só. Sem faixa para dividir, o passo é
   * zero e todo rótulo do eixo imprime o mesmo número.
   */
  it('abre uma faixa em torno de um valor único', () => {
    const scale = niceScale(7.2, 7.2)

    expect(scale.max).toBeGreaterThan(scale.min)
    expect(new Set(scale.ticks).size).toBe(scale.ticks.length)
    expect(scale.min).toBeLessThanOrEqual(7.2)
    expect(scale.max).toBeGreaterThanOrEqual(7.2)
  })

  it('não deixa migalha de ponto flutuante virar rótulo', () => {
    // Somar o passo repetidamente dá 0.30000000000000004, e isso ia impresso
    // no eixo.
    const scale = niceScale(0, 0.5, 5)

    for (const tick of scale.ticks) {
      expect(String(tick)).not.toMatch(/\d{6,}/)
    }
  })

  it('sobrevive a um valor não finito sem devolver NaN', () => {
    const scale = niceScale(Number.NaN, Number.NaN)

    expect(Number.isFinite(scale.min)).toBe(true)
    expect(Number.isFinite(scale.max)).toBe(true)
    expect(scale.ticks.every(Number.isFinite)).toBe(true)
  })
})

describe('positionIn', () => {
  it('devolve fração de 0 a 1 dentro da escala', () => {
    const scale = niceScale(0, 10, 5)

    expect(positionIn(scale, 0)).toBe(0)
    expect(positionIn(scale, 5)).toBe(0.5)
    expect(positionIn(scale, 10)).toBe(1)
  })

  it('grampeia valor fora da escala em vez de desenhar fora da caixa', () => {
    const scale = niceScale(0, 10, 5)

    expect(positionIn(scale, -4)).toBe(0)
    expect(positionIn(scale, 40)).toBe(1)
  })
})

/**
 * O eixo de idade conta meses. Duas coisas quebravam nele, e as duas só
 * apareceram olhando uma captura da tela com um recém-nascido de uma medida só.
 */
describe('niceScale com minStep (o eixo de idade)', () => {
  it('não desce abaixo de zero ao abrir faixa em torno de um ponto só', () => {
    // Com o padding nos dois sentidos, o eixo imprimia "-1" mês.
    const scale = niceScale(0, 0, 4, { minStep: 1 })

    expect(scale.min).toBe(0)
    expect(scale.max).toBeGreaterThan(0)
  })

  it('usa passo inteiro, nunca fração de mês', () => {
    // "0,25 meses" é uma semana, dita do jeito errado.
    for (const max of [1, 2, 3, 7, 14, 30, 228]) {
      const scale = niceScale(0, max, 4, { minStep: 1 })
      for (const tick of scale.ticks) {
        expect(Number.isInteger(tick)).toBe(true)
      }
    }
  })

  it('continua aceitando decimal onde decimal é a unidade', () => {
    // Peso e altura não passam mínimo nenhum: 0,5 kg é uma marca legítima.
    const scale = niceScale(3.2, 3.4)

    expect(scale.ticks.some((tick) => !Number.isInteger(tick))).toBe(true)
  })
})
