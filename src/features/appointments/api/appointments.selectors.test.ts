import { describe, expect, it } from 'vitest'

import { buildAppointment } from '@/test/fixtures/appointment'

import { latestMeasuredVisit } from './appointments.selectors'

describe('latestMeasuredVisit', () => {
  it('devolve a consulta medida mais recente, não a consulta mais recente', () => {
    const measured = buildAppointment({
      id: 'measured',
      status: 'COMPLETED',
      scheduledAt: '2026-03-12T10:00:00.000Z',
      weightGrams: 15800,
    })
    const laterWithoutMeasurement = buildAppointment({
      id: 'later',
      status: 'COMPLETED',
      scheduledAt: '2026-06-01T10:00:00.000Z',
    })

    expect(latestMeasuredVisit([measured, laterWithoutMeasurement])?.id).toBe('measured')
  })

  /**
   * O par sai de **uma** visita. Pegar o peso mais recente e a altura mais recente separadamente
   * daria dois números de dois dias diferentes exibidos sob uma data só — mentira sobre pelo menos
   * um deles.
   */
  it('não mistura o peso de uma visita com a altura de outra', () => {
    const older = buildAppointment({
      id: 'older',
      status: 'COMPLETED',
      scheduledAt: '2026-01-10T10:00:00.000Z',
      heightMillimeters: 900,
    })
    const newer = buildAppointment({
      id: 'newer',
      status: 'COMPLETED',
      scheduledAt: '2026-03-12T10:00:00.000Z',
      weightGrams: 15800,
    })

    const latest = latestMeasuredVisit([older, newer])

    expect(latest?.id).toBe('newer')
    expect(latest?.heightMillimeters).toBeNull()
  })

  it('ignora consulta cancelada e consulta sem medida', () => {
    const cancelled = buildAppointment({
      id: 'cancelled',
      status: 'CANCELLED',
      scheduledAt: '2026-06-01T10:00:00.000Z',
      weightGrams: 15800,
    })

    expect(latestMeasuredVisit([cancelled])).toBeNull()
    expect(latestMeasuredVisit([])).toBeNull()
  })
})
