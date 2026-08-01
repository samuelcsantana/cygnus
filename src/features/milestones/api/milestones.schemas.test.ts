import { describe, expect, it } from 'vitest'

import { createMilestoneFormSchema } from './milestones.schemas'

describe('createMilestoneFormSchema', () => {
  const schema = createMilestoneFormSchema('2025-06-01')

  it('rejects an achievedAt before the baby birth date', () => {
    const result = schema.safeParse({
      title: 'Primeiro sorriso',
      achievedAt: '2025-01-01',
      category: 'SOCIAL',
    })

    expect(result.success).toBe(false)
  })

  it('rejects an achievedAt in the future', () => {
    const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 10)

    const result = schema.safeParse({
      title: 'Primeiro sorriso',
      achievedAt: tomorrow,
      category: 'SOCIAL',
    })

    expect(result.success).toBe(false)
  })

  it('accepts a valid achievedAt between birth and today', () => {
    const result = schema.safeParse({
      title: 'Primeiro sorriso',
      achievedAt: '2025-08-01',
      category: 'SOCIAL',
    })

    expect(result.success).toBe(true)
  })
})
