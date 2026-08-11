import { z } from 'zod'

import { todayDateString } from '@/lib/date'

export const milestoneCategorySchema = z.enum(['MOTOR', 'LANGUAGE', 'SOCIAL', 'COGNITIVE', 'OTHER'])
export type MilestoneCategory = z.infer<typeof milestoneCategorySchema>

export const milestoneSchema = z.object({
  id: z.string().uuid(),
  babyId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  achievedAt: z.string(),
  category: milestoneCategorySchema,
  photoUrl: z.string().nullable(),
  createdAt: z.string(),
})
export type Milestone = z.infer<typeof milestoneSchema>

export const milestoneListSchema = z.array(milestoneSchema)

/**
 * `achievedAt` can't be validated by a static schema alone — it depends on
 * the selected baby's birthDate — so the schema is built per-baby via this
 * factory instead of being a module-level constant.
 */
export function createMilestoneFormSchema(birthDate: string) {
  return z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    achievedAt: z
      .string()
      .min(1)
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .superRefine((value, ctx) => {
        if (value > todayDateString()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'milestones.form.achievedAtFuture' })
        } else if (value < birthDate) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'milestones.form.achievedAtBeforeBirth' })
        }
      }),
    category: milestoneCategorySchema,
    photoUrl: z.union([z.string().url(), z.literal('')]).optional(),
  })
}
export type MilestoneFormInput = z.infer<ReturnType<typeof createMilestoneFormSchema>>

export const milestonePhotoUploadResponseSchema = z.object({
  url: z.string().url(),
})
export type MilestonePhotoUploadResponse = z.infer<typeof milestonePhotoUploadResponseSchema>
