import { describe, expect, it } from 'vitest'

import { vaccineProgress } from './vaccine-progress'

const routine = (status: 'APPLIED' | 'PENDING' | 'DELAYED' | 'GUIDANCE') =>
  ({ recommendationKind: 'ROUTINE', status }) as const

describe('vaccineProgress: o que entra no denominador', () => {
  /**
   * O caso que motivou o filtro por status, e que apareceu num calendário real
   * antes de aparecer num teste: "Febre amarela — situação excepcional" chega
   * como `ROUTINE` **e** `GUIDANCE`.
   *
   * Filtrar só por `recommendationKind` a deixava no total, e então a legenda
   * do cartão não fechava com o próprio denominador — 40 + 52 + 0 sob um total
   * de 93. Uma conta que não bate na tela lê-se como app quebrado, mesmo quando
   * cada número isolado está certo.
   */
  it('exclui uma dose de rotina que chegou como orientação', () => {
    const progress = vaccineProgress([routine('APPLIED'), routine('PENDING'), routine('GUIDANCE')])

    expect(progress.total).toBe(2)
    expect(progress.applied + progress.pending + progress.delayed).toBe(progress.total)
  })

  it('exclui as doses condicionais e recorrentes', () => {
    const progress = vaccineProgress([
      routine('APPLIED'),
      { recommendationKind: 'CONDITIONAL', status: 'APPLIED' },
      { recommendationKind: 'RECURRING', status: 'GUIDANCE' },
    ])

    // A condicional aplicada conta no subtítulo da página, que fala do
    // calendário inteiro, e não aqui — é a divergência que o cartão precisa
    // explicar mostrando o denominador.
    expect(progress.total).toBe(1)
    expect(progress.applied).toBe(1)
  })

  /**
   * Divisão por zero rende `NaN`, que renderiza como "NaN%" sem reprovar tipo
   * nem lint. Só um teste pega.
   */
  it('devolve 0% quando não há dose de rotina alguma', () => {
    const progress = vaccineProgress([{ recommendationKind: 'CONDITIONAL', status: 'GUIDANCE' }])

    expect(progress.total).toBe(0)
    expect(progress.percent).toBe(0)
    expect(Number.isNaN(progress.percent)).toBe(false)
  })

  it('conta o calendário vazio sem estourar', () => {
    expect(vaccineProgress([])).toEqual({ applied: 0, pending: 0, delayed: 0, total: 0, percent: 0 })
  })

  it('arredonda a porcentagem', () => {
    // 40 de 92 = 43,47…%
    const items = [
      ...Array.from({ length: 40 }, () => routine('APPLIED')),
      ...Array.from({ length: 52 }, () => routine('PENDING')),
    ]

    expect(vaccineProgress(items).percent).toBe(43)
  })

  it('separa atrasadas de pendentes', () => {
    const progress = vaccineProgress([routine('DELAYED'), routine('DELAYED'), routine('PENDING')])

    expect(progress.delayed).toBe(2)
    expect(progress.pending).toBe(1)
    expect(progress.applied).toBe(0)
    expect(progress.percent).toBe(0)
  })
})
