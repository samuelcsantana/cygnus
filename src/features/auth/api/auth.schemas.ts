import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})
export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
export type LoginInput = z.infer<typeof loginSchema>

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.string(),
})
export type User = z.infer<typeof userSchema>

export const okResponseSchema = z.object({
  status: z.literal('ok'),
  message: z.string(),
})

/**
 * The assisted sign-in flows: "sign in without a password" and "reset my
 * password". Both are the same machine — e-mail, then a 6-digit code — and
 * reset inserts one extra step before it ends in a session.
 */
export const assistedRequestSchema = z.object({
  email: z.string().email(),
})
export type AssistedRequestInput = z.infer<typeof assistedRequestSchema>

// Refined rather than `.length(6).regex(...)` so the message is a single i18n
// key: zod-error.ts maps a `custom` issue's message straight to a key, while
// the built-in codes would collapse "too short" and "not digits" into the same
// generic "invalid format".
const codeField = z
  .string()
  .refine((value) => /^\d{6}$/.test(value), { message: 'auth.assisted.codeFormat' })

export const passwordlessVerifySchema = z.object({
  email: z.string().email(),
  code: codeField,
})
export type PasswordlessVerifyInput = z.infer<typeof passwordlessVerifySchema>

export const passwordResetVerifySchema = z.object({
  email: z.string().email(),
  code: codeField,
  password: z.string().min(8),
})
export type PasswordResetVerifyInput = z.infer<typeof passwordResetVerifySchema>

/** The two password fields as the form collects them, before the code is added. */
export const newPasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'auth.assisted.passwordMismatch',
  })
export type NewPasswordInput = z.infer<typeof newPasswordSchema>

export const codeFormSchema = z.object({ code: codeField })
export type CodeFormInput = z.infer<typeof codeFormSchema>
