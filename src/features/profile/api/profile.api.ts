import { httpClient } from '@/lib/http-client'
import { userSchema, type User } from '@/features/auth/api/auth.schemas'

export interface UpdateProfilePayload {
  avatarUrl?: string | null
  name?: string
  password?: string
  currentPassword?: string
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const response = await httpClient.patch<unknown>('/users/me', payload)
  return userSchema.parse(response)
}

/**
 * The two ways to confirm deleting an account, and the API takes exactly one.
 *
 * `code` exists because an account created by signing in without a password has
 * no usable password at all — its hash is random bytes — so the password field
 * would lock it out of its own deletion. See `cygnus-api` #36.
 */
export type DeleteAccountProof = { currentPassword: string } | { code: string }

export async function deleteAccount(proof: DeleteAccountProof): Promise<void> {
  await httpClient.delete<void>('/users/me', { body: proof })
}

/** Mails a 6-digit code to the address on the account; spendable only on the deletion. */
export async function requestDeletionCode(): Promise<void> {
  await httpClient.post<unknown>('/users/me/deletion-code', {})
}
