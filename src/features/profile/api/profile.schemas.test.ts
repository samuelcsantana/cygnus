import { describe, expect, it } from 'vitest'

import { buildProfileFormSchema, changePasswordFormSchema } from './profile.schemas'

describe('buildProfileFormSchema', () => {
  const profileFormSchema = buildProfileFormSchema('parent@example.com')

  it('rejects an email change without currentPassword', () => {
    const result = profileFormSchema.safeParse({
      name: 'Jane Doe',
      email: 'new@example.com',
    })

    expect(result.success).toBe(false)
  })

  it('accepts an email change with currentPassword', () => {
    const result = profileFormSchema.safeParse({
      name: 'Jane Doe',
      email: 'new@example.com',
      currentPassword: 'my-password',
    })

    expect(result.success).toBe(true)
  })

  it('accepts a name change with the original email and no currentPassword', () => {
    const result = profileFormSchema.safeParse({
      name: 'Jane Smith',
      email: 'parent@example.com',
    })

    expect(result.success).toBe(true)
  })
})

describe('changePasswordFormSchema', () => {
  it('rejects mismatched passwords', () => {
    const result = changePasswordFormSchema.safeParse({
      currentPassword: 'current-Password1',
      newPassword: 'new-Password1',
      confirmNewPassword: 'different-Password1',
    })

    expect(result.success).toBe(false)
  })

  it('rejects a new password shorter than 8 characters', () => {
    const result = changePasswordFormSchema.safeParse({
      currentPassword: 'current-Password1',
      newPassword: 'short',
      confirmNewPassword: 'short',
    })

    expect(result.success).toBe(false)
  })

  it('accepts matching, long-enough passwords', () => {
    const result = changePasswordFormSchema.safeParse({
      currentPassword: 'current-Password1',
      newPassword: 'new-Password1',
      confirmNewPassword: 'new-Password1',
    })

    expect(result.success).toBe(true)
  })
})
