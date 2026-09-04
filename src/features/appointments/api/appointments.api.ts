import { httpClient } from '@/lib/http-client'
import { centimetersInputToMillimeters, kilogramsInputToGrams } from '@/shared/utils/measurements'

import {
  appointmentListSchema,
  appointmentSchema,
  medicalSpecialtyListSchema,
  updateAppointmentSchema,
  type Appointment,
  type AppointmentFormInput,
  type UpdateAppointmentInput,
} from './appointments.schemas'

export async function fetchAppointments(babyId: string): Promise<Appointment[]> {
  const response = await httpClient.get<unknown>(`/babies/${babyId}/appointments`)
  return appointmentListSchema.parse(response)
}

export async function fetchMedicalSpecialties(): Promise<string[]> {
  const response = await httpClient.get<unknown>('/specialties')
  return medicalSpecialtyListSchema.parse(response)
}

export async function createAppointment(
  babyId: string,
  input: AppointmentFormInput,
  // Passed in rather than read from `input` because the specialist may have been created moments
  // earlier, in the same submit, and its id does not exist until then.
  specialistId?: string,
): Promise<Appointment> {
  const scheduledAt = new Date(`${input.date}T${input.time}`).toISOString()
  const body = {
    scheduledAt,
    doctorName: input.doctorName,
    specialty: input.specialty || undefined,
    location: input.location || undefined,
    reason: input.reason || undefined,
    // Only sent when recording the past. SCHEDULED is the API's default and the
    // contract is additive, so omitting it keeps the request byte-identical to
    // what this app sent before COMPLETED existed.
    status: input.status === 'COMPLETED' ? 'COMPLETED' : undefined,
    specialistId: specialistId ?? input.specialistId,
    // Same reason, and one the API enforces: a measurement belongs to a visit that happened, so a
    // booking never carries one. Sending it would be a 400 the person could do nothing about.
    weightGrams: input.status === 'COMPLETED' ? (kilogramsInputToGrams(input.weightKg) ?? undefined) : undefined,
    heightMillimeters:
      input.status === 'COMPLETED' ? (centimetersInputToMillimeters(input.heightCm) ?? undefined) : undefined,
  }
  const response = await httpClient.post<unknown>(`/babies/${babyId}/appointments`, body)
  return appointmentSchema.parse(response)
}

export async function updateAppointment(
  babyId: string,
  appointmentId: string,
  input: UpdateAppointmentInput,
): Promise<Appointment> {
  const body = updateAppointmentSchema.parse(input)
  const response = await httpClient.patch<unknown>(`/babies/${babyId}/appointments/${appointmentId}`, body)
  return appointmentSchema.parse(response)
}

export async function deleteAppointment(babyId: string, appointmentId: string): Promise<void> {
  await httpClient.delete<void>(`/babies/${babyId}/appointments/${appointmentId}`)
}
