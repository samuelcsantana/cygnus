import { httpClient } from '@/lib/http-client'

import { babyListSchema, babySchema, createBabySchema, type Baby, type CreateBabyInput } from './babies.schemas'

export async function fetchBabies(): Promise<Baby[]> {
  const response = await httpClient.get<unknown>('/babies')
  return babyListSchema.parse(response)
}

export async function createBaby(input: CreateBabyInput): Promise<Baby> {
  const parsed = createBabySchema.parse(input)
  const body = {
    ...parsed,
    allergies: parsed.allergies && parsed.allergies.length > 0 ? parsed.allergies : undefined,
    avatarUrl: parsed.avatarUrl ? parsed.avatarUrl : undefined,
  }
  const response = await httpClient.post<unknown>('/babies', body)
  return babySchema.parse(response)
}
