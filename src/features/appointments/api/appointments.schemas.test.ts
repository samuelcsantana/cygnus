import { describe, expect, it } from 'vitest'

import { appointmentFormSchema } from './appointments.schemas'

describe('appointmentFormSchema', () => {
  it('rejects a date/time combination in the past', () => {
    const result = appointmentFormSchema.safeParse({
      date: '2020-01-01',
      time: '10:00',
      doctorName: 'Dra. Ana Silva',
    })

    expect(result.success).toBe(false)
  })

  it('accepts a valid future date/time', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10)
    const date = future.toISOString().slice(0, 10)

    const result = appointmentFormSchema.safeParse({
      date,
      time: '10:00',
      doctorName: 'Dra. Ana Silva',
    })

    expect(result.success).toBe(true)
  })

  it('requires a doctor name', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10)
    const date = future.toISOString().slice(0, 10)

    const result = appointmentFormSchema.safeParse({
      date,
      time: '10:00',
      doctorName: '',
    })

    expect(result.success).toBe(false)
  })
})
