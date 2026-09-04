import { z } from 'zod'

import { todayDateString } from '@/lib/date'

/**
 * Sexo ao nascer — variável clínica, não identidade de gênero, e por isso este nome.
 *
 * Ausente significa "não informado", e é resposta legítima: o campo não é lido por nada no app e
 * exigir dado sensível de uma criança sem uso é coleta que não se justifica. Não existe um terceiro
 * valor de enum para isso — ausência já é a forma de dizer, e duas formas de dizer a mesma coisa no
 * mesmo campo é o começo de uma consulta errada.
 */
export const sexAtBirthSchema = z.enum(['MALE', 'FEMALE'])
export type SexAtBirth = z.infer<typeof sexAtBirthSchema>

export const bloodTypeSchema = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
export type BloodType = z.infer<typeof bloodTypeSchema>

// Matches the backend's validation for `avatarColor` — a hex color used as the avatar's border.
export const avatarColorHexRegex = /^#[0-9A-Fa-f]{6}$/

export const babySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  birthDate: z.string(),
  sexAtBirth: sexAtBirthSchema.nullable(),
  bloodType: bloodTypeSchema.nullable(),
  allergies: z.array(z.string()),
  healthPlanName: z.string().nullable(),
  healthPlanNumber: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  avatarColor: z.string().nullable(),
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
  sexAtBirth: sexAtBirthSchema.optional(),
  bloodType: bloodTypeSchema.optional(),
  allergies: z.array(z.string().min(1)).optional(),
  // Free text, both of them: a plan's name is whatever is printed on the card, and the member
  // number carries letters, dashes and leading zeros depending on the operator. Anything narrower
  // would reject valid cards, which is the one thing this field cannot afford to do.
  healthPlanName: z.string().optional(),
  healthPlanNumber: z.string().optional(),
  // A native <input> always yields "" (never undefined) when left blank.
  avatarUrl: z.union([z.string().url(), z.literal('')]).optional(),
  avatarColor: z.union([z.string().regex(avatarColorHexRegex), z.literal('')]).optional(),
})
export type BabyFormInput = z.infer<typeof babyFormSchema>

export const guardianRoleSchema = z.enum(['OWNER', 'GUARDIAN'])
export type GuardianRole = z.infer<typeof guardianRoleSchema>

export const guardianSchema = z.object({
  userId: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: guardianRoleSchema,
  joinedAt: z.string(),
})
export type Guardian = z.infer<typeof guardianSchema>

export const guardianListSchema = z.array(guardianSchema)

export const createInviteResponseSchema = z.object({
  code: z.string(),
  expiresAt: z.string(),
})
export type CreateInviteResponse = z.infer<typeof createInviteResponseSchema>

