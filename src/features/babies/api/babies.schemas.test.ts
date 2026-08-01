import { describe, expect, it } from 'vitest'

import { createBabySchema } from './babies.schemas'

describe('createBabySchema', () => {
  it('rejects a birth date in the future', () => {
    const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 10)

    const result = createBabySchema.safeParse({
      name: 'Miguel',
      birthDate: tomorrow,
      gender: 'MALE',
    })

    expect(result.success).toBe(false)
  })

  it('accepts a valid past birth date with only the required fields', () => {
    const result = createBabySchema.safeParse({
      name: 'Miguel',
      birthDate: '2024-01-01',
      gender: 'MALE',
    })

    expect(result.success).toBe(true)
  })

  it('requires gender to be selected', () => {
    const result = createBabySchema.safeParse({
      name: 'Miguel',
      birthDate: '2024-01-01',
    })

    expect(result.success).toBe(false)
  })
})
