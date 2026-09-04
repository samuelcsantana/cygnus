import { z } from 'zod'

import { todayDateString } from '@/lib/date'

export const medicationSchema = z.object({
  id: z.string().uuid(),
  babyId: z.string().uuid(),
  name: z.string(),
  dosage: z.string().nullable(),
  frequency: z.string().nullable(),
  reason: z.string().nullable(),
  prescriberName: z.string().nullable(),
  startedOn: z.string(),
  // Null means no recorded end — not "still being taken today", which is a claim nothing here
  // verifies. See `isOngoing` for the distinction, which the UI has to keep.
  endedOn: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
})
export type Medication = z.infer<typeof medicationSchema>

export const medicationListSchema = z.array(medicationSchema)

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const medicationFormSchema = z
  .object({
    name: z.string().min(1),
    // Free text, exactly as the API stores it: drops, ml, mg, half a tablet and "every 8 hours" do
    // not share a shape, and a field that refuses what the prescription says is worse than one
    // that keeps it verbatim.
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    reason: z.string().optional(),
    prescriberName: z.string().optional(),
    startedOn: dateOnly,
    // A native <input> yields "" (never undefined) when left blank.
    endedOn: z.union([dateOnly, z.literal('')]).optional(),
    notes: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.startedOn > todayDateString()) {
      ctx.addIssue({ code: 'custom', message: 'medications.form.startedOnFuture', path: ['startedOn'] })
    }

    // Same-day is allowed on purpose: a fever medicine given one afternoon starts and ends on the
    // same day, and rejecting it would push people into writing a date that is not true.
    if (values.endedOn && values.endedOn < values.startedOn) {
      ctx.addIssue({ code: 'custom', message: 'medications.form.endedOnBeforeStart', path: ['endedOn'] })
    }
  })
export type MedicationFormInput = z.infer<typeof medicationFormSchema>

/**
 * "No recorded end", which is not the same claim as "being taken right now".
 *
 * The app knows what somebody wrote down; it does not watch a clock and it has no idea whether a
 * course was finished and never closed. Every label built on this must say the weaker, true thing.
 */
export function isOngoing(medication: Medication): boolean {
  return medication.endedOn === null
}
