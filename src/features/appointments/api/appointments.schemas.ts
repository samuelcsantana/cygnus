import { z } from 'zod'

import { nowLocalDateTimeString } from '@/lib/date'

export const appointmentStatusSchema = z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED'])
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>

export const appointmentSchema = z.object({
  id: z.string().uuid(),
  babyId: z.string().uuid(),
  scheduledAt: z.string(),
  doctorName: z.string(),
  location: z.string().nullable(),
  reason: z.string().nullable(),
  notes: z.string().nullable(),
  status: appointmentStatusSchema,
  createdAt: z.string(),
})
export type Appointment = z.infer<typeof appointmentSchema>

export const appointmentListSchema = z.array(appointmentSchema)

// The UI keeps date and time as separate inputs (better PT-BR UX); they're
// combined into a single ISO `scheduledAt` at the API boundary, not here —
// see appointments.api.ts.
export const appointmentFormSchema = z
  .object({
    date: z.string().min(1).regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().min(1).regex(/^\d{2}:\d{2}$/),
    doctorName: z.string().min(1),
    location: z.string().optional(),
    reason: z.string().optional(),
  })
  .refine((values) => `${values.date}T${values.time}` >= nowLocalDateTimeString(), {
    message: 'appointments.form.scheduledAtPast',
    path: ['date'],
  })
export type AppointmentFormInput = z.infer<typeof appointmentFormSchema>

export const updateAppointmentSchema = z.object({
  scheduledAt: z.string().optional(),
  doctorName: z.string().min(1).optional(),
  location: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(['COMPLETED', 'CANCELLED']).optional(),
})
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
