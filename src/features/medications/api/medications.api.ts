import { httpClient } from '@/lib/http-client'

import {
  medicationFormSchema,
  medicationListSchema,
  medicationSchema,
  type Medication,
  type MedicationFormInput,
} from './medications.schemas'

// Blank and whitespace-only both mean "not given"; the API takes `min(1)` on these.
function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export async function fetchMedications(babyId: string): Promise<Medication[]> {
  const response = await httpClient.get<unknown>(`/babies/${babyId}/medications`)
  return medicationListSchema.parse(response)
}

export async function createMedication(babyId: string, input: MedicationFormInput): Promise<Medication> {
  const parsed = medicationFormSchema.parse(input)
  const body = {
    name: parsed.name.trim(),
    startedOn: parsed.startedOn,
    dosage: optionalText(parsed.dosage),
    frequency: optionalText(parsed.frequency),
    reason: optionalText(parsed.reason),
    prescriberName: optionalText(parsed.prescriberName),
    endedOn: parsed.endedOn ? parsed.endedOn : undefined,
    notes: optionalText(parsed.notes),
  }
  const response = await httpClient.post<unknown>(`/babies/${babyId}/medications`, body)
  return medicationSchema.parse(response)
}

export async function updateMedication(
  babyId: string,
  medicationId: string,
  input: MedicationFormInput,
): Promise<Medication> {
  const parsed = medicationFormSchema.parse(input)
  // The edit form is pre-filled, so every field on screen is an explicit answer: an emptied one is
  // `null` (clear it), never an omission. Clearing `endedOn` reopens the course, which is the
  // correct reading of somebody deleting the end date they had typed.
  const body = {
    name: parsed.name.trim(),
    startedOn: parsed.startedOn,
    dosage: optionalText(parsed.dosage) ?? null,
    frequency: optionalText(parsed.frequency) ?? null,
    reason: optionalText(parsed.reason) ?? null,
    prescriberName: optionalText(parsed.prescriberName) ?? null,
    endedOn: parsed.endedOn ? parsed.endedOn : null,
    notes: optionalText(parsed.notes) ?? null,
  }
  const response = await httpClient.patch<unknown>(`/babies/${babyId}/medications/${medicationId}`, body)
  return medicationSchema.parse(response)
}

/**
 * Ending a course, which is the one edit this feature will get most often.
 *
 * A dedicated call rather than the full form: it sends `endedOn` alone, so nothing else about the
 * record can be touched by the act of closing it.
 */
export async function endMedication(babyId: string, medicationId: string, endedOn: string): Promise<Medication> {
  const response = await httpClient.patch<unknown>(`/babies/${babyId}/medications/${medicationId}`, { endedOn })
  return medicationSchema.parse(response)
}

export async function deleteMedication(babyId: string, medicationId: string): Promise<void> {
  await httpClient.delete<void>(`/babies/${babyId}/medications/${medicationId}`)
}
