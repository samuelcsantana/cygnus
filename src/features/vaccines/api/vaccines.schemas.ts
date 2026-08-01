import { z } from 'zod'

export const vaccineStatusSchema = z.enum(['PENDING', 'APPLIED', 'DELAYED'])
export type VaccineStatus = z.infer<typeof vaccineStatusSchema>

export const vaccineItemSchema = z.object({
  vaccineId: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  doseNumber: z.number(),
  recommendedAgeInMonths: z.number(),
  status: vaccineStatusSchema,
  applicationDate: z.string().nullable(),
  notes: z.string().nullable(),
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
  notes: z.string().optional(),
})
export type ApplyVaccineInput = z.infer<typeof applyVaccineSchema>
