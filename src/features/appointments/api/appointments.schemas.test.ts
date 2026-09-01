import { describe, expect, it } from 'vitest'

import { appointmentFormSchema } from './appointments.schemas'

describe('appointmentFormSchema', () => {
  it('rejects a date/time combination in the past', () => {
    const result = appointmentFormSchema.safeParse({
      date: '2020-01-01',
      time: '10:00',
      doctorName: 'Dra. Ana Silva',
      status: 'SCHEDULED',
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
      status: 'SCHEDULED',
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
      status: 'SCHEDULED',
    })

    expect(result.success).toBe(false)
  })
})

/**
 * The API fix did not loosen the invariant, it told the two acts apart. These
 * cover both directions, because either one passing alone is the state that
 * existed before: booking refusing the past, and nothing able to record it.
 */
describe('appointmentFormSchema: the two acts', () => {
  const inDays = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  it('refuses input with no declared intent, rather than guessing one', () => {
    const result = appointmentFormSchema.safeParse({
      date: inDays(10),
      time: '10:00',
      doctorName: 'Dra. Ana Silva',
    })

    // The form always supplies it — see `defaultValues`. Guessing here would
    // put the choice in two places, and they would drift.
    expect(result.success).toBe(false)
  })

  it('records a consultation that already happened', () => {
    const result = appointmentFormSchema.safeParse({
      date: inDays(-10),
      time: '10:00',
      doctorName: 'Dra. Ana Silva',
      status: 'COMPLETED',
    })

    expect(result.success).toBe(true)
  })

  it('refuses to record a future date as already completed', () => {
    const result = appointmentFormSchema.safeParse({
      date: inDays(10),
      time: '10:00',
      doctorName: 'Dra. Ana Silva',
      status: 'COMPLETED',
    })

    expect(result.success).toBe(false)
  })

  it('sends each direction to its own i18n key', () => {
    const pastWhileBooking = appointmentFormSchema.safeParse({
      date: inDays(-1),
      time: '10:00',
      doctorName: 'Dra. Ana Silva',
      status: 'SCHEDULED',
    })
    const futureWhileRecording = appointmentFormSchema.safeParse({
      date: inDays(1),
      time: '10:00',
      doctorName: 'Dra. Ana Silva',
      status: 'COMPLETED',
    })

    // The message IS the i18n key: zod-error.ts maps a custom issue straight to
    // it. Collapsing the two into one generic string would tell the person the
    // opposite of what they got wrong.
    expect(pastWhileBooking.success).toBe(false)
    expect(!pastWhileBooking.success && pastWhileBooking.error.issues[0]?.message).toBe(
      'appointments.form.scheduledAtPast',
    )
    expect(futureWhileRecording.success).toBe(false)
    expect(!futureWhileRecording.success && futureWhileRecording.error.issues[0]?.message).toBe(
      'appointments.form.completedAtFuture',
    )
  })
})
