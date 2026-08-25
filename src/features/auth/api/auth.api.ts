import { httpClient } from '@/lib/http-client'

import {
  assistedRequestSchema,
  loginSchema,
  okResponseSchema,
  passwordResetVerifySchema,
  passwordlessVerifySchema,
  registerSchema,
  userSchema,
  type AssistedRequestInput,
  type LoginInput,
  type PasswordResetVerifyInput,
  type PasswordlessVerifyInput,
  type RegisterInput,
  type User,
} from './auth.schemas'

export async function registerUser(input: RegisterInput): Promise<User> {
  const body = registerSchema.parse(input)
  const response = await httpClient.post<unknown>('/auth/register', body)
  return userSchema.parse(response)
}

export async function loginUser(input: LoginInput): Promise<void> {
  const body = loginSchema.parse(input)
  const response = await httpClient.post<unknown>('/auth/login', body)
  okResponseSchema.parse(response)
}

export async function logoutUser(): Promise<void> {
  const response = await httpClient.post<unknown>('/auth/logout')
  okResponseSchema.parse(response)
}

export async function getCurrentUser(): Promise<User> {
  const response = await httpClient.get<unknown>('/auth/me')
  return userSchema.parse(response)
}

/**
 * Assisted sign-in. The request endpoints answer the same way whether or not
 * the address has an account — the UI must never become a way to find out
 * which e-mails are registered — so there is nothing in the response to read
 * beyond "accepted".
 */
export async function requestPasswordlessCode(input: AssistedRequestInput): Promise<void> {
  const body = assistedRequestSchema.parse(input)
  const response = await httpClient.post<unknown>('/auth/passwordless/request', body)
  okResponseSchema.parse(response)
}

export async function verifyPasswordlessCode(input: PasswordlessVerifyInput): Promise<void> {
  const body = passwordlessVerifySchema.parse(input)
  const response = await httpClient.post<unknown>('/auth/passwordless/verify', body)
  okResponseSchema.parse(response)
}

export async function requestPasswordResetCode(input: AssistedRequestInput): Promise<void> {
  const body = assistedRequestSchema.parse(input)
  const response = await httpClient.post<unknown>('/auth/password-reset/request', body)
  okResponseSchema.parse(response)
}

export async function verifyPasswordReset(input: PasswordResetVerifyInput): Promise<void> {
  const body = passwordResetVerifySchema.parse(input)
  const response = await httpClient.post<unknown>('/auth/password-reset/verify', body)
  okResponseSchema.parse(response)
}
