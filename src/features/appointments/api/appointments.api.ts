import { httpClient } from '@/lib/http-client'

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

export async function createAppointment(babyId: string, input: AppointmentFormInput): Promise<Appointment> {
  const scheduledAt = new Date(`${input.date}T${input.time}`).toISOString()
  const body = {
    scheduledAt,
    doctorName: input.doctorName,
    specialty: input.specialty || undefined,
    location: input.location || undefined,
    reason: input.reason || undefined,
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
