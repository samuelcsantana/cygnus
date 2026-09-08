import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/http-client'
import { TrashIcon } from '@/shared/icons/trash-icon'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import { useDeleteAccount, useRequestDeletionCode } from '../api/profile.hooks'
import { deleteAccountFormSchema, type DeleteAccountFormInput } from '../api/profile.schemas'

interface DeleteAccountDialogProps {
  onDeleted?: () => void
}

export function DeleteAccountDialog({ onDeleted }: DeleteAccountDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  /**
   * `'password'` até alguém dizer que não tem uma. Não dá para descobrir sozinho:
   * a conta criada por código guarda um hash aleatório, indistinguível de um
   * hash de verdade, então o app não sabe quem tem senha — quem sabe é a pessoa.
   */
  const [proof, setProof] = useState<'password' | 'code'>('password')
  const [code, setCode] = useState('')
  const deleteAccount = useDeleteAccount()
  const requestCode = useRequestDeletionCode()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeleteAccountFormInput>({
    resolver: zodResolver(deleteAccountFormSchema),
    defaultValues: { currentPassword: '' },
  })

  const busy = isSubmitting || deleteAccount.isPending || requestCode.isPending
  const changeOpen = (nextOpen: boolean) => {
    if (busy) return
    setOpen(nextOpen)
    if (!nextOpen) {
      reset()
      setCode('')
      setProof('password')
      deleteAccount.reset()
      requestCode.reset()
    }
  }
  const confirm = async (payload: Parameters<typeof deleteAccount.mutateAsync>[0]) => {
    if (busy) return
    try {
      await deleteAccount.mutateAsync(payload)
      setOpen(false)
      onDeleted?.()
    } catch {
      // surfaced below via deleteAccount.error, dialog stays open
    }
  }

  const onSubmitPassword = handleSubmit((values) =>
    confirm({ currentPassword: values.currentPassword }),
  )

  // Não passa pelo `handleSubmit`: o resolver do formulário exige a senha, e no
  // modo código não há senha para exigir — validá-la aqui faria o envio nunca
  // chegar ao handler, em silêncio.
  const onSubmitCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!busy && /^\d{6}$/.test(code)) void confirm({ code })
  }

  const askForCode = async () => {
    if (busy) return
    setProof('code')
    await requestCode.mutateAsync().catch(() => {
      // O endpoint responde 200 até quando limita, então falha aqui é rede. O
      // campo continua na tela: quem já tem um código válido de um pedido
      // anterior ainda consegue usá-lo, e esconder o campo tiraria essa saída.
    })
  }

  const currentPasswordErrorKey = fieldErrorKey(errors.currentPassword)

  const submitErrorMessage =
    deleteAccount.error instanceof ApiError && deleteAccount.error.status === 400
      ? t('profile.delete.incorrectPassword')
      : deleteAccount.error
        ? t('profile.delete.genericError')
        : null

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="min-h-11 shrink-0 text-destructive hover:text-destructive/80 flex items-center gap-2 text-sm font-bold transition-colors"
        >
          <TrashIcon className="h-4 w-4" />
          {t('profile.delete.action')}
        </button>
      </DialogTrigger>
      <DialogContent showCloseButton={!busy} className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('profile.delete.confirmTitle')}</DialogTitle>
        </DialogHeader>

        <p className="text-ink-muted text-sm">{t('profile.delete.confirmDescription')}</p>

        <form
          onSubmit={proof === 'code' ? onSubmitCode : onSubmitPassword}
          className="space-y-4"
          noValidate
        >
          {proof === 'code' ? (
            <div>
              <Label htmlFor="delete-account-code">{t('profile.delete.codeLabel')}</Label>
              <Input
                id="delete-account-code"
                disabled={busy}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                className="mt-2"
              />
              <p className="mt-1.5 text-sm text-ink-muted">
                {requestCode.isPending
                  ? t('profile.delete.codeSending')
                  : requestCode.isError
                    ? t('profile.delete.codeError')
                    : t('profile.delete.codeSent')}
              </p>
            </div>
          ) : (
            <div>
              <Label htmlFor="delete-account-password">
                {t('profile.delete.currentPasswordLabel')}
              </Label>
              <Input
                id="delete-account-password"
                disabled={busy}
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.currentPassword}
                aria-describedby={
                  currentPasswordErrorKey ? 'delete-account-password-error' : undefined
                }
                className="mt-2"
                {...register('currentPassword')}
              />
              {currentPasswordErrorKey && (
                <p id="delete-account-password-error" className="text-destructive mt-1 text-sm">
                  {t(currentPasswordErrorKey)}
                </p>
              )}
              {/* Quem entrou sem senha nunca definiu uma, e o app não tem como
                saber disso — o hash aleatório é indistinguível de um de verdade.
                Então quem diz é a pessoa. */}
              <button
                type="button"
                onClick={askForCode}
                disabled={busy}
                className="mt-2 text-sm font-semibold text-primary underline underline-offset-2"
              >
                {t('profile.delete.useCode')}
              </button>
            </div>
          )}

          {submitErrorMessage && (
            <p role="alert" className="text-destructive text-sm">
              {submitErrorMessage}
            </p>
          )}

          {/* Cancelar vem antes, e existe porque este era o único diálogo do
              app sem saída rotulada: os controles eram "Excluir conta
              permanentemente" e o X do canto, nada mais. Todos os outros
              oferecem um "Cancelar" ao lado da ação primária — e o que não
              oferecia era justamente o irreversível, onde a escolha segura
              deveria ser pelo menos tão fácil de alcançar quanto a destrutiva. */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => changeOpen(false)}
              disabled={busy}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={busy || (proof === 'code' && code.length !== 6)}
            >
              {busy ? t('common.saving') : t('profile.delete.confirmAction')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
