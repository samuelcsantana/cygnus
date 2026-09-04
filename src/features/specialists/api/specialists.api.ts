import { httpClient } from '@/lib/http-client'

import {
  specialistFormSchema,
  specialistListSchema,
  specialistSchema,
  type Specialist,
  type SpecialistFormInput,
} from './specialists.schemas'

// Blank and whitespace-only both mean "not given". The API takes `min(1)`, so neither can be sent
// as a value — and a phone stored as a single space looks filled in the list while being useless
// at the moment it is needed.
function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export async function fetchSpecialists(babyId: string): Promise<Specialist[]> {
  const response = await httpClient.get<unknown>(`/babies/${babyId}/specialists`)
  return specialistListSchema.parse(response)
}

export async function createSpecialist(babyId: string, input: SpecialistFormInput): Promise<Specialist> {
  const parsed = specialistFormSchema.parse(input)
  const body = {
    name: parsed.name.trim(),
    specialty: optionalText(parsed.specialty),
    phone: optionalText(parsed.phone),
  }
  const response = await httpClient.post<unknown>(`/babies/${babyId}/specialists`, body)
  return specialistSchema.parse(response)
}

export async function updateSpecialist(
  babyId: string,
  specialistId: string,
  input: SpecialistFormInput,
): Promise<Specialist> {
  const parsed = specialistFormSchema.parse(input)
  // The edit form is pre-filled with the current values, so every field on screen is an explicit
  // answer: an emptied one is `null` (clear it), never an omission (leave it alone).
  const body = {
    name: parsed.name.trim(),
    specialty: optionalText(parsed.specialty) ?? null,
    phone: optionalText(parsed.phone) ?? null,
  }
  const response = await httpClient.patch<unknown>(`/babies/${babyId}/specialists/${specialistId}`, body)
  return specialistSchema.parse(response)
}

export async function deleteSpecialist(babyId: string, specialistId: string): Promise<void> {
  await httpClient.delete<void>(`/babies/${babyId}/specialists/${specialistId}`)
}
