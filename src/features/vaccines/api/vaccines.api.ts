import { httpClient } from '@/lib/http-client'

import {
  adhocVaccineListSchema,
  adhocVaccineRecordSchema,
  applyVaccineSchema,
  createAdhocVaccineSchema,
  vaccineCalendarSchema,
  vaccineItemSchema,
  type AdhocVaccineRecord,
  type ApplyVaccineInput,
  type CreateAdhocVaccineInput,
  type VaccineAgeGroup,
  type VaccineItem,
} from './vaccines.schemas'

export async function fetchVaccineCalendar(babyId: string): Promise<VaccineAgeGroup[]> {
  const response = await httpClient.get<unknown>(`/babies/${babyId}/vaccines`)
  return vaccineCalendarSchema.parse(response)
}

// The backend's photoUrl is a strict URL — a native <input> always yields ''
// (never undefined) when left blank, so that gets stripped before sending
// rather than loosening the API's validation (same convention as milestones).
function withoutEmptyPhotoUrl<T extends { photoUrl?: string }>(input: T): T {
  return { ...input, photoUrl: input.photoUrl || undefined }
}

export async function applyVaccine(
  babyId: string,
  vaccineId: string,
  input: ApplyVaccineInput,
): Promise<VaccineItem> {
  const body = applyVaccineSchema.parse(withoutEmptyPhotoUrl(input))
  const response = await httpClient.patch<unknown>(`/babies/${babyId}/vaccines/${vaccineId}/apply`, body)
  return vaccineItemSchema.parse(response)
}

export async function fetchAdhocVaccines(babyId: string): Promise<AdhocVaccineRecord[]> {
  const response = await httpClient.get<unknown>(`/babies/${babyId}/vaccines/adhoc`)
  return adhocVaccineListSchema.parse(response)
}

export async function registerAdhocVaccine(
  babyId: string,
  input: CreateAdhocVaccineInput,
): Promise<AdhocVaccineRecord> {
  const body = createAdhocVaccineSchema.parse(withoutEmptyPhotoUrl(input))
  const response = await httpClient.post<unknown>(`/babies/${babyId}/vaccines/adhoc`, body)
  return adhocVaccineRecordSchema.parse(response)
}

export async function deleteAdhocVaccine(babyId: string, recordId: string): Promise<void> {
  await httpClient.delete<void>(`/babies/${babyId}/vaccines/adhoc/${recordId}`)
}
