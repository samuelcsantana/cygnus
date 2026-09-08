import { expect, it } from 'vitest'
import { medicationStatus, medicationFormSchema } from './medications.schemas'
const today = '2026-09-07'
it.each([
  ['2026-09-08', null, 'PLANNED'],
  ['2026-09-08', '2026-09-30', 'PLANNED'],
  ['2026-09-01', null, 'OPEN'],
  ['2026-09-01', '2026-09-30', 'ACTIVE'],
  ['2026-09-01', '2026-09-07', 'ENDING_TODAY'],
  ['2026-09-07', '2026-09-07', 'ENDING_TODAY'],
  ['2026-09-01', '2026-09-06', 'ENDED'],
] as const)('classifies %s to %s as %s', (startedOn, endedOn, status) => {
  expect(medicationStatus({ startedOn, endedOn }, today)).toBe(status)
})
it('includes the last day and ends on the next local date', () => {
  const record = { startedOn: '2026-09-01', endedOn: '2026-09-30' }
  expect(medicationStatus(record, '2026-09-30')).toBe('ENDING_TODAY')
  expect(medicationStatus(record, '2026-10-01')).toBe('ENDED')
})
it('accepts a future start and same-day course but rejects an end before start', () => {
  expect(
    medicationFormSchema.safeParse({
      name: 'Registro',
      startedOn: '2099-01-01',
      endedOn: '2099-01-01',
    }).success,
  ).toBe(true)
  expect(
    medicationFormSchema.safeParse({
      name: 'Registro',
      startedOn: '2099-01-02',
      endedOn: '2099-01-01',
    }).success,
  ).toBe(false)
})
