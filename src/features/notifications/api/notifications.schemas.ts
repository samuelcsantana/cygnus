import { z } from 'zod'

export const notificationTypeSchema = z.enum(['VACCINE_DELAYED', 'APPOINTMENT_UPCOMING'])
export type NotificationType = z.infer<typeof notificationTypeSchema>

export const notificationSchema = z.object({
  id: z.string().uuid(),
  babyId: z.string().uuid(),
  type: notificationTypeSchema,
  referenceId: z.string(),
  title: z.string(),
  message: z.string(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
})
export type Notification = z.infer<typeof notificationSchema>

export const notificationListSchema = z.array(notificationSchema)
