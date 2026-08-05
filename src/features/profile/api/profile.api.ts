import { httpClient } from '@/lib/http-client'
import { userSchema, type User } from '@/features/auth/api/auth.schemas'

export interface UpdateProfilePayload {
  name?: string
  email?: string
  password?: string
  currentPassword?: string
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const response = await httpClient.patch<unknown>('/users/me', payload)
  return userSchema.parse(response)
}

export async function deleteAccount(currentPassword: string): Promise<void> {
  await httpClient.delete<void>('/users/me', { body: { currentPassword } })
}
