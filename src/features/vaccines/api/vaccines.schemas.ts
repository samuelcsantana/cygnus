import { z } from 'zod'

export const vaccineStatusSchema = z.enum(['PENDING', 'APPLIED', 'DELAYED'])
export type VaccineStatus = z.infer<typeof vaccineStatusSchema>

export const vaccineRecordSourceSchema = z.enum(['CATALOG', 'CAMPAIGN', 'CUSTOM'])
export type VaccineRecordSource = z.infer<typeof vaccineRecordSourceSchema>
const adhocSourceSchema = z.enum(['CAMPAIGN', 'CUSTOM'])

// Shared by ApplyVaccineDialog (a known catalog vaccine) and the register
// wizard's step 2 (campaign/custom vaccines) — same detail fields either way.
const applicationDetailsShape = {
  notes: z.string().optional(),
  batchNumber: z.string().optional(),
  location: z.string().optional(),
  professional: z.string().optional(),
  photoUrl: z.union([z.string().url(), z.literal('')]).optional(),
}
export interface VaccineApplicationDetailsInput {
  applicationDate?: string
  notes?: string
  batchNumber?: string
  location?: string
  professional?: string
  photoUrl?: string
}

export const vaccineItemSchema = z.object({
  vaccineId: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  doseNumber: z.number(),
  recommendedAgeInMonths: z.number(),
  status: vaccineStatusSchema,
  applicationDate: z.string().nullable(),
  notes: z.string().nullable(),
  batchNumber: z.string().nullable(),
  location: z.string().nullable(),
  professional: z.string().nullable(),
  photoUrl: z.string().nullable(),
})
export type VaccineItem = z.infer<typeof vaccineItemSchema>

export const vaccineAgeGroupSchema = z.object({
  ageInMonths: z.number(),
  items: z.array(vaccineItemSchema),
})
export type VaccineAgeGroup = z.infer<typeof vaccineAgeGroupSchema>

export const vaccineCalendarSchema = z.array(vaccineAgeGroupSchema)

export const applyVaccineSchema = z.object({
  applicationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  ...applicationDetailsShape,
})
export type ApplyVaccineInput = z.infer<typeof applyVaccineSchema>

export const createAdhocVaccineSchema = z.object({
  source: adhocSourceSchema,
  customName: z.string().trim().min(1),
  customDose: z.string().trim().optional(),
  applicationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ...applicationDetailsShape,
})
export type CreateAdhocVaccineInput = z.infer<typeof createAdhocVaccineSchema>

export const adhocVaccineRecordSchema = z.object({
  id: z.string().uuid(),
  babyId: z.string().uuid(),
  source: adhocSourceSchema,
  customName: z.string(),
  customDose: z.string().nullable(),
  status: z.literal('APPLIED'),
  applicationDate: z.string().nullable(),
  notes: z.string().nullable(),
  batchNumber: z.string().nullable(),
  location: z.string().nullable(),
  professional: z.string().nullable(),
  photoUrl: z.string().nullable(),
})
export type AdhocVaccineRecord = z.infer<typeof adhocVaccineRecordSchema>
export const adhocVaccineListSchema = z.array(adhocVaccineRecordSchema)
