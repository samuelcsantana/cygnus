import { z } from 'zod'

import { nowLocalDateTimeString } from '@/lib/date'

export const appointmentStatusSchema = z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED'])
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>

export const appointmentSchema = z.object({
  id: z.string().uuid(),
  babyId: z.string().uuid(),
  scheduledAt: z.string(),
  doctorName: z.string(),
  specialty: z.string().nullable(),
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
/**
 * Which of the two acts the form is performing.
 *
 * The API models them as two, not as one with a relaxed rule: SCHEDULED books
 * something upcoming and refuses a past date; COMPLETED records a consultation
 * that already happened and refuses a future one. Booking for last Tuesday is
 * still a typo, and the invariant that catches it is not loosened here — it is
 * mirrored, in the other direction.
 *
 * Deliberately an explicit choice rather than inferred from the date. Reading
 * "the date is in the past, so they must have meant to record it" would silently
 * reinterpret exactly the typo the rule exists to catch.
 */
export const appointmentIntentSchema = z.enum(['SCHEDULED', 'COMPLETED'])
export type AppointmentIntent = z.infer<typeof appointmentIntentSchema>

export const appointmentFormSchema = z
  .object({
    date: z.string().min(1).regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().min(1).regex(/^\d{2}:\d{2}$/),
    doctorName: z.string().min(1),
    specialty: z.string().optional(),
    location: z.string().optional(),
    reason: z.string().optional(),
    // Required, with no `.default()`. A default here would make the schema's
    // input type differ from its output type, and `zodResolver` cannot
    // reconcile the two — `status?` going in, `status` coming out, across every
    // `Control` and `Resolver` in the feature. The default belongs where a form
    // default belongs: in `defaultValues`, which is also the only place that
    // knows the field starts on "book it".
    status: appointmentIntentSchema,
  })
  .superRefine((values, ctx) => {
    const quando = `${values.date}T${values.time}`
    const agora = nowLocalDateTimeString()

    // `custom` on purpose: `zod-error.ts` maps a custom issue's message straight
    // to an i18n key, while a built-in code would collapse both directions into
    // one generic string and the person would be told the wrong thing.
    if (values.status === 'COMPLETED') {
      if (quando > agora) {
        ctx.addIssue({ code: 'custom', message: 'appointments.form.completedAtFuture', path: ['date'] })
      }
      return
    }

    if (quando < agora) {
      ctx.addIssue({ code: 'custom', message: 'appointments.form.scheduledAtPast', path: ['date'] })
    }
  })
export type AppointmentFormInput = z.infer<typeof appointmentFormSchema>

export const medicalSpecialtyListSchema = z.array(z.string())

export const updateAppointmentSchema = z.object({
  scheduledAt: z.string().optional(),
  doctorName: z.string().min(1).optional(),
  specialty: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(['COMPLETED', 'CANCELLED']).optional(),
})
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
