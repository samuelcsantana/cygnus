import { httpClient } from '@/lib/http-client'

import {
  applyVaccineSchema,
  vaccineCalendarSchema,
  vaccineItemSchema,
  type ApplyVaccineInput,
  type VaccineAgeGroup,
  type VaccineItem,
} from './vaccines.schemas'

export async function fetchVaccineCalendar(babyId: string): Promise<VaccineAgeGroup[]> {
  const response = await httpClient.get<unknown>(`/babies/${babyId}/vaccines`)
  return vaccineCalendarSchema.parse(response)
}

export async function applyVaccine(
  babyId: string,
  vaccineId: string,
  input: ApplyVaccineInput,
): Promise<VaccineItem> {
  const body = applyVaccineSchema.parse(input)
  const response = await httpClient.patch<unknown>(`/babies/${babyId}/vaccines/${vaccineId}/apply`, body)
  return vaccineItemSchema.parse(response)
}
