import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { User } from '@/features/auth/api/auth.schemas'
import { ApiError } from '@/lib/http-client'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import { useUpdateProfile } from '../api/profile.hooks'
import { buildProfileFormSchema, type ProfileFormInput } from '../api/profile.schemas'

interface ProfileFormProps {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { t } = useTranslation()
  const updateProfile = useUpdateProfile()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(buildProfileFormSchema(user.email)),
    defaultValues: { name: user.name, email: user.email, currentPassword: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    const emailChanged = values.email !== user.email

    try {
      await updateProfile.mutateAsync({
        name: values.name,
        email: emailChanged ? values.email : undefined,
        currentPassword: emailChanged ? values.currentPassword : undefined,
      })
      reset({ name: values.name, email: values.email, currentPassword: '' })
      toast.success(t('profile.form.savedToast'))
    } catch {
      // surfaced below via updateProfile.error
    }
  })

  const nameErrorKey = fieldErrorKey(errors.name)
  const emailErrorKey = fieldErrorKey(errors.email)
  const currentPasswordErrorKey = fieldErrorKey(errors.currentPassword)

  const submitErrorMessage =
    updateProfile.error instanceof ApiError && updateProfile.error.status === 409
      ? t('profile.form.emailTaken')
      : updateProfile.error instanceof ApiError && updateProfile.error.status === 400
        ? t('profile.form.incorrectCurrentPassword')
        : updateProfile.error
          ? t('profile.form.genericError')
          : null

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div>
        <Label htmlFor="profile-name">{t('profile.form.nameLabel')}</Label>
        <Input
          id="profile-name"
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={nameErrorKey ? 'profile-name-error' : undefined}
          className="mt-2"
          {...register('name')}
        />
        {nameErrorKey && (
          <p id="profile-name-error" className="text-destructive mt-1 text-sm">
            {t(nameErrorKey)}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="profile-email">{t('profile.form.emailLabel')}</Label>
        <Input
          id="profile-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={emailErrorKey ? 'profile-email-error' : undefined}
          className="mt-2"
          {...register('email')}
        />
        {emailErrorKey && (
          <p id="profile-email-error" className="text-destructive mt-1 text-sm">
            {t(emailErrorKey)}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="profile-current-password">{t('profile.form.currentPasswordLabel')}</Label>
        <Input
          id="profile-current-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.currentPassword}
          aria-describedby={currentPasswordErrorKey ? 'profile-current-password-error' : 'profile-current-password-hint'}
          className="mt-2"
          {...register('currentPassword')}
        />
        {currentPasswordErrorKey ? (
          <p id="profile-current-password-error" className="text-destructive mt-1 text-sm">
            {t(currentPasswordErrorKey)}
          </p>
        ) : (
          <p id="profile-current-password-hint" className="text-ink-muted mt-1 text-sm">
            {t('profile.form.currentPasswordHint')}
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
          {isSubmitting ? t('common.saving') : t('profile.form.submit')}
        </Button>
      </div>
    </form>
  )
}
