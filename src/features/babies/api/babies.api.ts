import { httpClient } from '@/lib/http-client'

import {
  babyFormSchema,
  babyListSchema,
  babySchema,
  createInviteResponseSchema,
  guardianListSchema,
  type Baby,
  type BabyFormInput,
  type CreateInviteResponse,
  type Guardian,
} from './babies.schemas'

export async function fetchBabies(): Promise<Baby[]> {
  const response = await httpClient.get<unknown>('/babies')
  return babyListSchema.parse(response)
}

export async function createBaby(input: BabyFormInput): Promise<Baby> {
  const parsed = babyFormSchema.parse(input)
  const body = {
    ...parsed,
    allergies: parsed.allergies && parsed.allergies.length > 0 ? parsed.allergies : undefined,
    avatarUrl: parsed.avatarUrl ? parsed.avatarUrl : undefined,
    avatarColor: parsed.avatarColor ? parsed.avatarColor : undefined,
  }
  const response = await httpClient.post<unknown>('/babies', body)
  return babySchema.parse(response)
}

/**
 * Unlike create, edit always sends the full form state (nulls for cleared
 * optional fields) rather than omitting untouched-looking fields — the form
 * is pre-filled with the current profile, so every field the user sees is
 * an explicit value, not a partial patch.
 */
export async function updateBaby(babyId: string, input: BabyFormInput): Promise<Baby> {
  const parsed = babyFormSchema.parse(input)
  const body = {
    name: parsed.name,
    birthDate: parsed.birthDate,
    gender: parsed.gender,
    bloodType: parsed.bloodType ?? null,
    allergies: parsed.allergies ?? [],
    avatarUrl: parsed.avatarUrl ? parsed.avatarUrl : null,
    avatarColor: parsed.avatarColor ? parsed.avatarColor : null,
  }
  const response = await httpClient.patch<unknown>(`/babies/${babyId}`, body)
  return babySchema.parse(response)
}

export async function deleteBaby(babyId: string): Promise<void> {
  await httpClient.delete<void>(`/babies/${babyId}`)
}

export async function fetchBabyGuardians(babyId: string): Promise<Guardian[]> {
  const response = await httpClient.get<unknown>(`/babies/${babyId}/guardians`)
  return guardianListSchema.parse(response)
}

export async function createBabyInvite(babyId: string, inviteeEmail?: string): Promise<CreateInviteResponse> {
  const body = inviteeEmail ? { inviteeEmail } : {}
  const response = await httpClient.post<unknown>(`/babies/${babyId}/invites`, body)
  return createInviteResponseSchema.parse(response)
}

export async function removeBabyGuardian(babyId: string, userId: string): Promise<void> {
  await httpClient.delete<void>(`/babies/${babyId}/guardians/${userId}`)
}
