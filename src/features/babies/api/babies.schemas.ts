import { z } from 'zod'

import { todayDateString } from '@/lib/date'

export const genderSchema = z.enum(['MALE', 'FEMALE'])
export type Gender = z.infer<typeof genderSchema>

export const bloodTypeSchema = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
export type BloodType = z.infer<typeof bloodTypeSchema>

export const babySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  birthDate: z.string(),
  gender: genderSchema,
  bloodType: bloodTypeSchema.nullable(),
  allergies: z.array(z.string()),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
})
export type Baby = z.infer<typeof babySchema>

export const babyListSchema = z.array(babySchema)

// Shared by both the create and edit flows — the form always collects the
// same fields; only the API call (POST vs PATCH) differs.
export const babyFormSchema = z.object({
  name: z.string().min(1),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => value <= todayDateString(), { message: 'babies.form.birthDateFuture' }),
  gender: genderSchema,
  bloodType: bloodTypeSchema.optional(),
  allergies: z.array(z.string().min(1)).optional(),
  // A native <input> always yields "" (never undefined) when left blank.
  avatarUrl: z.union([z.string().url(), z.literal('')]).optional(),
})
export type BabyFormInput = z.infer<typeof babyFormSchema>

