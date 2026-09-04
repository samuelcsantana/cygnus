import { z } from 'zod'

import { nowLocalDateTimeString } from '@/lib/date'
import {
  HEIGHT_CM_MAX,
  HEIGHT_CM_MIN,
  WEIGHT_KG_MAX,
  WEIGHT_KG_MIN,
  parseDecimalInput,
} from '@/shared/utils/measurements'

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
  // Whole grams and whole millimetres, as the API stores them. Nothing in the UI shows these units
  // — `shared/utils/measurements` is the single place that converts, in both directions.
  weightGrams: z.number().nullable(),
  heightMillimeters: z.number().nullable(),
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

/**
 * Blank is a valid answer — most visits have no measurement — so only a value that is present and
 * out of range is an error. The message is an i18n key, which is what `zod-error.ts` expects from
 * a custom issue.
 */
function assertMeasurementInRange(
  value: string | undefined,
  min: number,
  max: number,
  path: 'weightKg' | 'heightCm',
  message: string,
  ctx: z.RefinementCtx,
): void {
  const parsed = parseDecimalInput(value)

  if (parsed === null) {
    return
  }

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    ctx.addIssue({ code: 'custom', message, path: [path] })
  }
}

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
    // Text, not `type="number"`, and validated by hand for it: a Brazilian numeric keypad offers a
    // comma, and a number input discards the whole value when it sees one — the person watches
    // their entry vanish on blur with no error to explain why.
    weightKg: z.string().optional(),
    heightCm: z.string().optional(),
    // Set when the person picks somebody already saved. `doctorName` is still what gets written on
    // the visit — this only records who, of the saved list, it was.
    specialistId: z.string().uuid().optional(),
    // "Save this professional too", applied when the appointment is saved and not before: if the
    // dialog is abandoned, nothing was created.
    saveSpecialist: z.boolean().optional(),
  })
  .superRefine((values, ctx) => {
    assertMeasurementInRange(values.weightKg, WEIGHT_KG_MIN, WEIGHT_KG_MAX, 'weightKg', 'appointments.form.weightInvalid', ctx)
    assertMeasurementInRange(values.heightCm, HEIGHT_CM_MIN, HEIGHT_CM_MAX, 'heightCm', 'appointments.form.heightInvalid', ctx)

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
  weightGrams: z.number().int().nullable().optional(),
  heightMillimeters: z.number().int().nullable().optional(),
  scheduledAt: z.string().optional(),
  doctorName: z.string().min(1).optional(),
  specialty: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(['COMPLETED', 'CANCELLED']).optional(),
})
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
