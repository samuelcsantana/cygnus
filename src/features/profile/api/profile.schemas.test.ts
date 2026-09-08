import { describe, expect, it } from 'vitest'

import { profileFormSchema, changePasswordFormSchema } from './profile.schemas'

describe('profileFormSchema', () => {
  it('strips email and password from profile form data', () => {
    expect(
      profileFormSchema.parse({
        name: ' Jane ',
        email: 'new@example.com',
        currentPassword: 'password',
      }),
    ).toEqual({ name: 'Jane' })
  })
  it('rejects a blank name', () => {
    expect(profileFormSchema.safeParse({ name: '   ' }).success).toBe(false)
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
