import { z } from 'zod'

export const profileFormSchema = z.object({
  name: z.string().trim().min(1),
  avatarUrl: z.string().max(524288).optional(),
})
export type ProfileFormInput = z.infer<typeof profileFormSchema>

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmNewPassword: z.string().min(8),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    message: 'profile.password.mismatch',
    path: ['confirmNewPassword'],
  })
export type ChangePasswordFormInput = z.infer<typeof changePasswordFormSchema>

export const deleteAccountFormSchema = z.object({
  currentPassword: z.string().min(1),
})
export type DeleteAccountFormInput = z.infer<typeof deleteAccountFormSchema>
