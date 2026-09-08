import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { AvatarUploadField } from '@/shared/components/AvatarUploadField'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { User } from '@/features/auth/api/auth.schemas'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import { useUpdateProfile } from '../api/profile.hooks'
import { profileFormSchema, type ProfileFormInput } from '../api/profile.schemas'

interface ProfileFormProps {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { t } = useTranslation()
  const updateProfile = useUpdateProfile()
  const [processingPhoto, setProcessingPhoto] = useState(false)

  const {
    register,
    control,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: user.name, avatarUrl: user.avatarUrl ?? '' },
  })

  const [name, avatarUrl] = useWatch({ control, name: ['name', 'avatarUrl'] })
  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await updateProfile.mutateAsync({
        name: values.name,
        ...(values.avatarUrl !== (user.avatarUrl ?? '')
          ? { avatarUrl: values.avatarUrl || null }
          : {}),
      })
      reset({ name: saved.name, avatarUrl: saved.avatarUrl ?? '' })
      toast.success(t('profile.form.savedToast'))
    } catch {
      // The mutation error is displayed below.
    }
  })

  const nameErrorKey = fieldErrorKey(errors.name)
  const submitErrorMessage = updateProfile.error ? t('profile.form.genericError') : null

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="rounded-2xl bg-muted/40 p-4">
        <p className="mb-3 text-sm font-semibold text-ink">{t('profile.photo.title')}</p>
        <AvatarUploadField
          value={avatarUrl}
          onValueChange={(value) =>
            setValue('avatarUrl', value, { shouldDirty: true, shouldValidate: true })
          }
          fallback={
            <span className="text-2xl font-bold text-primary">
              {(name || user.name).trim().slice(0, 1).toUpperCase()}
            </span>
          }
          uploadLabel={t(avatarUrl ? 'profile.photo.change' : 'profile.photo.add')}
          removeLabel={t('profile.photo.remove')}
          fileTooLargeError={t('profile.photo.tooLarge')}
          invalidImageError={t('profile.photo.invalid')}
          color={undefined}
          onColorChange={() => {}}
          colorOptions={[]}
          colorGroupLabel={t('profile.photo.title')}
          disabled={isSubmitting}
          onProcessingChange={setProcessingPhoto}
        />
        <p className="mt-3 text-xs text-ink-muted">{t('profile.photo.hint')}</p>
      </div>
      <div>
        <Label htmlFor="profile-name">{t('profile.form.nameLabel')}</Label>
        <Input
          id="profile-name"
          disabled={isSubmitting}
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
          value={user.email}
          readOnly
          aria-describedby="profile-email-hint"
          className="mt-2 bg-muted text-ink-muted"
        />
        <p id="profile-email-hint" className="mt-2 text-xs text-ink-muted">
          {t('profile.form.emailReadOnly')}
        </p>
      </div>

      {submitErrorMessage && (
        <p role="alert" className="text-destructive text-sm">
          {submitErrorMessage}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || processingPhoto || !isDirty}>
          {isSubmitting ? t('common.saving') : t('profile.form.submit')}
        </Button>
      </div>
    </form>
  )
}
