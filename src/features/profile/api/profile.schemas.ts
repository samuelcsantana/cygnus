import { z } from 'zod'

/**
 * currentPassword is only required when the email actually changes — the
 * backend enforces the same rule, so this mirrors it client-side to avoid a
 * round trip. originalEmail comes from the loaded user, not a static value.
 */
export function buildProfileFormSchema(originalEmail: string) {
  return z
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      currentPassword: z.string().optional(),
    })
    .superRefine((values, ctx) => {
      if (values.email !== originalEmail && !values.currentPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'profile.form.currentPasswordRequiredForEmail',
          path: ['currentPassword'],
        })
      }
    })
}
export type ProfileFormInput = z.infer<ReturnType<typeof buildProfileFormSchema>>

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
