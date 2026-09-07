import { describe, expect, it } from 'vitest'

import { buildAppointment } from '@/test/fixtures/appointment'

import { clipBand, growthSeries, indicatorPoints, outgrewReference, referenceBand } from './growth.selectors'

const BIRTH = '2026-01-15'

describe('growthSeries', () => {
  it('ordena da consulta mais antiga para a mais recente', () => {
    // A lista de consultas ordena ao contrário — certo para "o que aconteceu
    // agora", errado para uma curva, que se lê da esquerda para a direita.
    const series = growthSeries(
      [
        buildAppointment({ id: 'b', status: 'COMPLETED', scheduledAt: '2026-06-01T10:00:00.000Z', weightGrams: 7200 }),
        buildAppointment({ id: 'a', status: 'COMPLETED', scheduledAt: '2026-03-01T10:00:00.000Z', weightGrams: 5400 }),
      ],
      BIRTH,
    )

    expect(series.map((point) => point.appointmentId)).toEqual(['a', 'b'])
  })

  it('ignora a consulta sem medida nenhuma', () => {
    const series = growthSeries(
      [
        buildAppointment({ id: 'medida', status: 'COMPLETED', weightGrams: 5400 }),
        buildAppointment({ id: 'sem-medida', status: 'COMPLETED' }),
      ],
      BIRTH,
    )

    expect(series.map((point) => point.appointmentId)).toEqual(['medida'])
  })

  /**
   * Mesma regra do `latestMeasuredVisit`: a API aceita medida numa consulta
   * cancelada, mas consulta cancelada não pesou ninguém.
   */
  it('ignora consulta cancelada, mesmo com medida gravada', () => {
    const series = growthSeries(
      [buildAppointment({ id: 'cancelada', status: 'CANCELLED', weightGrams: 5400 })],
      BIRTH,
    )

    expect(series).toEqual([])
  })

  it('coloca o ponto na idade da consulta, não na idade de hoje', () => {
    const [point] = growthSeries(
      [buildAppointment({ status: 'COMPLETED', scheduledAt: '2026-07-15T12:00:00.000Z', weightGrams: 8000 })],
      BIRTH,
    )

    expect(point!.ageMonthsWhole).toBe(6)
    expect(point!.ageMonths).toBeGreaterThan(5.9)
    expect(point!.ageMonths).toBeLessThan(6.1)
  })
})

describe('indicatorPoints', () => {
  /**
   * A visita que pesou sem medir não é evidência sobre a altura. Interpolar por
   * cima do buraco desenharia uma reta afirmando exatamente isso.
   */
  it('descarta o ponto do indicador que aquela consulta não registrou', () => {
    const series = growthSeries(
      [
        buildAppointment({
          id: 'so-peso',
          status: 'COMPLETED',
          scheduledAt: '2026-03-01T10:00:00.000Z',
          weightGrams: 5400,
        }),
        buildAppointment({
          id: 'os-dois',
          status: 'COMPLETED',
          scheduledAt: '2026-06-01T10:00:00.000Z',
          weightGrams: 7200,
          heightMillimeters: 650,
        }),
      ],
      BIRTH,
    )

    expect(indicatorPoints(series, 'weight')).toHaveLength(2)
    expect(indicatorPoints(series, 'height')).toHaveLength(1)
    expect(indicatorPoints(series, 'height')[0]!.y).toBe(650)
  })

  it('devolve o valor cru, na unidade da API', () => {
    // Grama e milímetro atravessam o gráfico inteiro; a conversão para kg e cm
    // mora só em `measurements.ts`, na hora de escrever o rótulo.
    const series = growthSeries(
      [buildAppointment({ status: 'COMPLETED', weightGrams: 15800, heightMillimeters: 1020 })],
      BIRTH,
    )

    expect(indicatorPoints(series, 'weight')[0]!.y).toBe(15800)
    expect(indicatorPoints(series, 'height')[0]!.y).toBe(1020)
  })
})

describe('referenceBand', () => {
  /**
   * A OMS publica uma curva para meninos e outra para meninas, e não existe uma
   * neutra. Escolher qualquer uma para quem não informou o sexo ao nascer —
   * opcional desde a #82 — seria inventar a comparação.
   */
  it('não devolve faixa quando o sexo ao nascer não foi informado', () => {
    expect(referenceBand('weight', null)).toBeNull()
  })

  it('devolve a tabela inteira, para o gráfico cortar', () => {
    const band = referenceBand('weight', 'MALE')!

    expect(band.at(-1)![0]).toBeGreaterThan(59)
  })

  it('devolve valores nas unidades da API, crescendo com a idade', () => {
    const band = referenceBand('weight', 'MALE')!
    const [ageAtBirth, p3, p15, p50, p85, p97] = band[0]!

    expect(ageAtBirth).toBe(0)
    // Peso ao nascer de menino na mediana da OMS: 3.346 g.
    expect(p50).toBe(3346)
    expect(p3).toBeLessThan(p15)
    expect(p15).toBeLessThan(p50)
    expect(p50).toBeLessThan(p85)
    expect(p85).toBeLessThan(p97)
    expect(band.at(-1)![3]).toBeGreaterThan(p50)
  })
})

describe('clipBand', () => {
  it('corta na idade que o eixo desenha', () => {
    const band = clipBand(referenceBand('weight', 'MALE'), 14)!

    expect(band.length).toBeGreaterThan(2)
    // Uma linha além da borda, de propósito: sem ela a faixa para antes do fim
    // do eixo e aparece um degrau.
    expect(band.at(-1)![0]).toBeGreaterThan(14)
    expect(band.at(-2)![0]).toBeLessThanOrEqual(14)
  })

  it('não corta nada para quem já passou do fim da tabela', () => {
    const band = clipBand(referenceBand('height', 'FEMALE'), 90)!

    expect(band.at(-1)![0]).toBeGreaterThan(59)
    expect(band.at(-1)![0]).toBeLessThan(62)
  })

  it('devolve null, e não lista vazia, quando não há faixa', () => {
    // A diferença importa: `[]` faria o gráfico pintar um path vazio e a legenda
    // continuar dizendo que existe referência. Uma linha sozinha não desenha
    // área nenhuma, então conta como não haver.
    expect(clipBand(null, 24)).toBeNull()
    expect(clipBand([[0, 1, 2, 3, 4, 5]], 24)).toBeNull()
  })

  it('mantém uma linha além da borda, para a faixa alcançar o fim do eixo', () => {
    const band = clipBand(referenceBand('height', 'MALE'), 6)!

    expect(band.at(-1)![0]).toBeGreaterThan(6)
    expect(band.at(-2)![0]).toBeLessThanOrEqual(6)
  })
})

describe('outgrewReference', () => {
  it('reconhece a criança que passou do fim da tabela', () => {
    const antes = growthSeries(
      [buildAppointment({ status: 'COMPLETED', scheduledAt: '2028-01-15T10:00:00.000Z', weightGrams: 15000 })],
      BIRTH,
    )
    const depois = growthSeries(
      [buildAppointment({ status: 'COMPLETED', scheduledAt: '2031-06-15T10:00:00.000Z', weightGrams: 22000 })],
      BIRTH,
    )

    expect(outgrewReference(antes)).toBe(false)
    expect(outgrewReference(depois)).toBe(true)
  })
})
