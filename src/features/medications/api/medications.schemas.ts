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

const dateOnly = z.string().date()

export const medicationFormSchema = z
  .object({
    name: z.string().trim().min(1),
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
    // Same-day is allowed on purpose: a fever medicine given one afternoon starts and ends on the
    // same day, and rejecting it would push people into writing a date that is not true.
    if (values.endedOn && values.endedOn < values.startedOn) {
      ctx.addIssue({
        code: 'custom',
        message: 'medications.form.endedOnBeforeStart',
        path: ['endedOn'],
      })
    }
  })
export type MedicationFormInput = z.infer<typeof medicationFormSchema>

export type MedicationStatus = 'PLANNED' | 'OPEN' | 'ACTIVE' | 'ENDING_TODAY' | 'ENDED'
/** Calendar dates are local and the recorded last day is inclusive. */
export function medicationStatus(
  medication: Pick<Medication, 'startedOn' | 'endedOn'>,
  today = todayDateString(),
): MedicationStatus {
  if (medication.startedOn > today) return 'PLANNED'
  if (!medication.endedOn) return 'OPEN'
  if (medication.endedOn < today) return 'ENDED'
  return medication.endedOn === today ? 'ENDING_TODAY' : 'ACTIVE'
}
export function isOngoing(medication: Medication, today = todayDateString()): boolean {
  const status = medicationStatus(medication, today)
  return status === 'OPEN' || status === 'ACTIVE' || status === 'ENDING_TODAY'
}
export function sortMedications(items: Medication[], today = todayDateString()): Medication[] {
  const rank = { ENDING_TODAY: 0, ACTIVE: 1, OPEN: 1, PLANNED: 2, ENDED: 3 }
  return [...items].sort(
    (a, b) =>
      rank[medicationStatus(a, today)] - rank[medicationStatus(b, today)] ||
      (medicationStatus(a, today) === 'PLANNED'
        ? a.startedOn.localeCompare(b.startedOn)
        : b.startedOn.localeCompare(a.startedOn)),
  )
}
