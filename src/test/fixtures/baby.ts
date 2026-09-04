import type { Baby } from '@/features/babies/api/babies.schemas'

/**
 * One `Baby` shape for every suite that needs one — component props and mocked
 * API responses alike.
 *
 * It was written out by hand in nine places before this, and every field added
 * to the profile broke five of them at once with a type error that had nothing
 * to do with what the suite was testing. Worse, an MSW handler that returns a
 * baby is parsed by `babySchema` for real: a literal that falls behind the
 * schema does not fail as a type error there, it fails as a mutation that never
 * resolves and a dialog that never closes — three layers from the cause.
 *
 * Only structure belongs here. Anything a test asserts on (a name, an allergy,
 * a blood type) is passed as an override at the call site, where the reader can
 * see it.
 */
export function buildBaby(overrides: Partial<Baby> = {}): Baby {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    userId: '99999999-9999-4999-8999-999999999999',
    name: 'Baby One',
    birthDate: '2024-01-01',
    gender: 'FEMALE',
    bloodType: null,
    allergies: [],
    avatarUrl: null,
    avatarColor: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}
