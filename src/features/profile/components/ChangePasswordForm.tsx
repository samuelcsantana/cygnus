import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
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

/**
 * Os três campos de senha só existem depois que alguém pede para trocá-la.
 *
 * Abertos por padrão, esta página mostrava **quatro** campos de senha de uma vez — três aqui e o
 * "senha atual" do formulário de conta — para quem tinha entrado só para mudar o idioma. Trocar a
 * senha é uma tarefa deliberada e rara; ocupar a tela com ela por padrão treina a pessoa a
 * ignorar campos de senha, que é o hábito que menos se quer criar num app com dado de saúde.
 */
export function ChangePasswordForm() {
  const { t } = useTranslation()
  const updateProfile = useUpdateProfile()
  const [isOpen, setIsOpen] = useState(false)

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
      // Fecha ao salvar: a tarefa acabou, e deixar os campos abertos e vazios sugere que não.
      setIsOpen(false)
      toast.success(t('profile.password.savedToast'))
    } catch {
      // surfaced below via updateProfile.error
    }
  })

  function close() {
    reset()
    updateProfile.reset()
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <div>
        <p className="text-sm text-ink-muted">{t('profile.password.sectionDescription')}</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => setIsOpen(true)}>
          {t('profile.password.startAction')}
        </Button>
      </div>
    )
  }

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

      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={close}
          className="px-2 py-2 text-sm font-bold text-ink-muted transition-colors hover:text-ink"
        >
          {t('common.cancel')}
        </button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.saving') : t('profile.password.submit')}
        </Button>
      </div>
    </form>
  )
}
