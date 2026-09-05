import { httpClient } from '@/lib/http-client'

import {
  specialistFormSchema,
  specialistListSchema,
  specialistSchema,
  type Specialist,
  type SpecialistFormInput,
} from './specialists.schemas'

// Blank and whitespace-only both mean "not given"; the API takes `min(1)` on these — and a phone
// stored as a single space looks filled in the list and is useless when it is needed.
function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export async function fetchSpecialists(): Promise<Specialist[]> {
  const response = await httpClient.get<unknown>('/specialists')
  return specialistListSchema.parse(response)
}

export async function createSpecialist(input: SpecialistFormInput): Promise<Specialist> {
  const parsed = specialistFormSchema.parse(input)
  const body = {
    name: parsed.name.trim(),
    specialty: optionalText(parsed.specialty),
    phone: optionalText(parsed.phone),
    babyIds: parsed.babyIds,
    sharedWithUserIds: parsed.sharedWithUserIds,
  }
  const response = await httpClient.post<unknown>('/specialists', body)
  return specialistSchema.parse(response)
}

export async function updateSpecialist(specialistId: string, input: SpecialistFormInput): Promise<Specialist> {
  const parsed = specialistFormSchema.parse(input)
  // O formulário mostra o estado inteiro, então tudo o que ele manda é resposta explícita: uma
  // lista vazia significa "nenhuma criança", e não "não mexi".
  const body = {
    name: parsed.name.trim(),
    specialty: optionalText(parsed.specialty) ?? null,
    phone: optionalText(parsed.phone) ?? null,
    babyIds: parsed.babyIds,
    sharedWithUserIds: parsed.sharedWithUserIds,
  }
  const response = await httpClient.patch<unknown>(`/specialists/${specialistId}`, body)
  return specialistSchema.parse(response)
}

export async function deleteSpecialist(specialistId: string): Promise<void> {
  await httpClient.delete<void>(`/specialists/${specialistId}`)
}
