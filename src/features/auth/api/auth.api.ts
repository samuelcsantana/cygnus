import { httpClient } from '@/lib/http-client'

import {
  loginSchema,
  okResponseSchema,
  registerSchema,
  userSchema,
  type LoginInput,
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
