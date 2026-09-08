import { expect, it } from 'vitest'
import { buildAppointment } from '@/test/fixtures/appointment'
import { appointmentGroup, sortAppointments } from './appointment-view'
it('separates past schedules without changing their status and orders the next appointment first', () => {
  const now = Date.parse('2026-09-07T12:00:00Z')
  const past = buildAppointment({ scheduledAt: '2026-09-01T10:00:00Z' })
  const future = buildAppointment({ scheduledAt: '2026-09-10T10:00:00Z' })
  const later = buildAppointment({ scheduledAt: '2026-09-11T10:00:00Z' })
  const done = buildAppointment({ status: 'COMPLETED' })
  expect(appointmentGroup(past, now)).toBe('REVIEW')
  expect(past.status).toBe('SCHEDULED')
  expect(sortAppointments([done, later, past, future], now)).toEqual([future, later, past, done])
})
