import { describe, expect, it } from 'vitest'

import { buildAppointment } from '@/test/fixtures/appointment'

import { growthSeries, indicatorPoints } from './growth.selectors'

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
