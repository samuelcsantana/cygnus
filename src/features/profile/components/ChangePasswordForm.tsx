import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/http-client'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import { useUpdateProfile } from '../api/profile.hooks'
import { changePasswordFormSchema, type ChangePasswordFormInput } from '../api/profile.schemas'

export function ChangePasswordForm() {
  const { t } = useTranslation()
  const updateProfile = useUpdateProfile()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormInput>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateProfile.mutateAsync({ password: values.newPassword, currentPassword: values.currentPassword })
      reset()
      toast.success(t('profile.password.savedToast'))
    } catch {
      // surfaced below via updateProfile.error
    }
  })

  const currentPasswordErrorKey = fieldErrorKey(errors.currentPassword)
  const newPasswordErrorKey = fieldErrorKey(errors.newPassword)
  const confirmNewPasswordErrorKey = fieldErrorKey(errors.confirmNewPassword)

  const submitErrorMessage =
    updateProfile.error instanceof ApiError && updateProfile.error.status === 400
      ? t('profile.password.incorrectCurrentPassword')
      : updateProfile.error
        ? t('profile.password.genericError')
        : null

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div>
        <Label htmlFor="change-password-current">{t('profile.password.currentPasswordLabel')}</Label>
        <Input
          id="change-password-current"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.currentPassword}
          aria-describedby={currentPasswordErrorKey ? 'change-password-current-error' : undefined}
          className="mt-2"
          {...register('currentPassword')}
        />
        {currentPasswordErrorKey && (
          <p id="change-password-current-error" className="text-destructive mt-1 text-sm">
            {t(currentPasswordErrorKey)}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="change-password-new">{t('profile.password.newPasswordLabel')}</Label>
        <Input
          id="change-password-new"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.newPassword}
          aria-describedby={newPasswordErrorKey ? 'change-password-new-error' : undefined}
          className="mt-2"
          {...register('newPassword')}
        />
        {newPasswordErrorKey && (
          <p id="change-password-new-error" className="text-destructive mt-1 text-sm">
            {t(newPasswordErrorKey)}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="change-password-confirm">{t('profile.password.confirmNewPasswordLabel')}</Label>
        <Input
          id="change-password-confirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmNewPassword}
          aria-describedby={confirmNewPasswordErrorKey ? 'change-password-confirm-error' : undefined}
          className="mt-2"
          {...register('confirmNewPassword')}
        />
        {confirmNewPasswordErrorKey && (
          <p id="change-password-confirm-error" className="text-destructive mt-1 text-sm">
            {t(confirmNewPasswordErrorKey)}
          </p>
        )}
      </div>

      {submitErrorMessage && (
        <p role="alert" className="text-destructive text-sm">
          {submitErrorMessage}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.saving') : t('profile.password.submit')}
        </Button>
      </div>
    </form>
  )
}
