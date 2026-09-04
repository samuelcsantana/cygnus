import { z } from 'zod'

export const specialistSchema = z.object({
  id: z.string().uuid(),
  babyId: z.string().uuid(),
  name: z.string(),
  specialty: z.string().nullable(),
  phone: z.string().nullable(),
  createdAt: z.string(),
})
export type Specialist = z.infer<typeof specialistSchema>

export const specialistListSchema = z.array(specialistSchema)

export const specialistFormSchema = z.object({
  name: z.string().min(1),
  specialty: z.string().optional(),
  // No format check, matching the API. A number can be a landline, a mobile, a clinic switchboard
  // with an extension, or one written with the country code — and this is the field somebody
  // reaches for at 3am. Refusing a real number to enforce a shape is the failure it cannot afford.
  phone: z.string().optional(),
})
export type SpecialistFormInput = z.infer<typeof specialistFormSchema>
