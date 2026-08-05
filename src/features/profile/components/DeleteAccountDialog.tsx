import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/http-client'
import { TrashIcon } from '@/shared/icons/trash-icon'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import { useDeleteAccount } from '../api/profile.hooks'
import { deleteAccountFormSchema, type DeleteAccountFormInput } from '../api/profile.schemas'

interface DeleteAccountDialogProps {
  onDeleted?: () => void
}

export function DeleteAccountDialog({ onDeleted }: DeleteAccountDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const deleteAccount = useDeleteAccount()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeleteAccountFormInput>({
    resolver: zodResolver(deleteAccountFormSchema),
    defaultValues: { currentPassword: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await deleteAccount.mutateAsync(values.currentPassword)
      setOpen(false)
      onDeleted?.()
    } catch {
      // surfaced below via deleteAccount.error, dialog stays open
    }
  })

  const currentPasswordErrorKey = fieldErrorKey(errors.currentPassword)

  const submitErrorMessage =
    deleteAccount.error instanceof ApiError && deleteAccount.error.status === 400
      ? t('profile.delete.incorrectPassword')
      : deleteAccount.error
        ? t('profile.delete.genericError')
        : null

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) reset()
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-destructive hover:text-destructive/80 flex items-center gap-2 text-sm font-bold transition-colors"
        >
          <TrashIcon className="h-4 w-4" />
          {t('profile.delete.action')}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('profile.delete.confirmTitle')}</DialogTitle>
        </DialogHeader>

        <p className="text-ink-muted text-sm">{t('profile.delete.confirmDescription')}</p>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="delete-account-password">{t('profile.delete.currentPasswordLabel')}</Label>
            <Input
              id="delete-account-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.currentPassword}
              aria-describedby={currentPasswordErrorKey ? 'delete-account-password-error' : undefined}
              className="mt-2"
              {...register('currentPassword')}
            />
            {currentPasswordErrorKey && (
              <p id="delete-account-password-error" className="text-destructive mt-1 text-sm">
                {t(currentPasswordErrorKey)}
              </p>
            )}
          </div>

          {submitErrorMessage && (
            <p role="alert" className="text-destructive text-sm">
              {submitErrorMessage}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('profile.delete.confirmAction')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
