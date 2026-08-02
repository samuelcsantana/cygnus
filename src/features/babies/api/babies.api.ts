import { httpClient } from '@/lib/http-client'

import { babyFormSchema, babyListSchema, babySchema, type Baby, type BabyFormInput } from './babies.schemas'

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
  }
  const response = await httpClient.patch<unknown>(`/babies/${babyId}`, body)
  return babySchema.parse(response)
}

export async function deleteBaby(babyId: string): Promise<void> {
  await httpClient.delete<void>(`/babies/${babyId}`)
}
