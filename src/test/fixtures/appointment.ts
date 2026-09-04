import type { Appointment } from '@/features/appointments/api/appointments.schemas'

/**
 * One `Appointment` shape for every suite that needs one — component props and mocked API
 * responses alike. The sibling of `buildBaby`, added for the same reason and after the same
 * breakage.
 *
 * The mocked-response copies are the ones that bite: an MSW handler returning an appointment is
 * parsed by `appointmentSchema` for real, so a literal that falls behind the schema does not fail
 * as a type error — it fails as a mutation that never resolves and a dialog that never closes,
 * several layers from the cause.
 *
 * Only structure lives here. Whatever a test asserts on — a doctor's name, a status, a date — is
 * an override at the call site, where the reader can see it.
 */
export function buildAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    babyId: '22222222-2222-4222-8222-222222222222',
    scheduledAt: '2026-09-01T10:00:00.000Z',
    doctorName: 'Dra. Ana Souza',
    specialty: 'Pediatria',
    location: null,
    reason: null,
    notes: null,
    status: 'SCHEDULED',
    createdAt: '2026-08-01T10:00:00.000Z',
    ...overrides,
  }
}
