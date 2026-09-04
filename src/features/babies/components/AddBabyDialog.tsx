import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { StepIndicator } from '@/shared/components/StepIndicator'
import { CloseIcon } from '@/shared/icons/close-icon'
import { LogoIcon } from '@/shared/icons/logo-icon'

import { useCreateBaby } from '../api/babies.hooks'
import { babyFormSchema, type BabyFormInput } from '../api/babies.schemas'
import { BabyHealthFields } from './BabyHealthFields'
import { BabyProfileFields } from './BabyProfileFields'

type Step = 'profile' | 'health'

interface AddBabyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddBabyDialog({ open, onOpenChange }: AddBabyDialogProps) {
  const { t } = useTranslation()
  const createBaby = useCreateBaby()
  const [step, setStep] = useState<Step>('profile')

  const {
    register,
    control,
    handleSubmit,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BabyFormInput>({
    resolver: zodResolver(babyFormSchema),
    defaultValues: { allergies: [], avatarUrl: '', avatarColor: '' },
  })

  useEffect(() => {
    if (!open) {
      setStep('profile')
      reset({ allergies: [], avatarUrl: '', avatarColor: '' })
    }
  }, [open, reset])

  const handleContinue = async () => {
    const isValid = await trigger(['name', 'birthDate', 'gender'])
    if (isValid) {
      setStep('health')
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      // Sem este catch a rejeição vira unhandled rejection: o diálogo fica
      // aberto, o botão volta ao normal e nada é dito. A pessoa clica de novo,
      // e se a falha tiver sido parcial isso duplica o registro. Os formulários
      // compartilhados (BabyForm, MilestoneForm, AppointmentForm) já faziam
      // isto; os assistentes que têm formulário próprio ficaram de fora.
      await createBaby.mutateAsync(values)
    } catch {
      return // a mensagem aparece abaixo, a partir de createBaby.error
    }
    toast.success(t('babies.form.successToast'))
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-h-[85vh] overflow-y-auto p-0 sm:max-w-lg">
        <div className="relative bg-gradient-to-br from-emerald-700 to-emerald-600 px-7 pt-7 pb-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('common.close')}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
          <LogoIcon className="mb-2 h-8 w-8 text-white" />
          <DialogTitle className="font-display text-xl font-extrabold text-white">{t('babies.form.title')}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-white/80">{t('babies.form.subtitle')}</DialogDescription>
        </div>

        <div className="p-7">
          <StepIndicator
            steps={[
              { id: 'profile', label: t('babies.wizard.stepProfile') },
              { id: 'health', label: t('babies.wizard.stepHealth') },
            ]}
            currentStepId={step}
            accentClassName="bg-emerald-600"
            className="mb-6"
          />

          {step === 'profile' ? (
            // Deliberately not inside a <form>: a same-position button whose `type`
            // flips from "button" to "submit" on click (React reuses the DOM node)
            // can trigger a native submit on that very click if it's a form
            // descendant, even though the click handler itself never calls submit.
            <div key="profile" className="animate-fade-in-up">
              <BabyProfileFields register={register} control={control} errors={errors} />
              <div className="mt-6 flex items-center justify-end gap-4 border-t border-border pt-6">
                <Button type="button" onClick={handleContinue}>
                  {t('babies.wizard.continue')}
                </Button>
              </div>
            </div>
          ) : (
            <form key="health" onSubmit={onSubmit} noValidate className="animate-fade-in-up">
              <BabyHealthFields register={register} control={control} />
              <div className="mt-6 flex items-center justify-end gap-4 border-t border-border pt-6">
                <button
                  type="button"
                  onClick={() => setStep('profile')}
                  className="px-6 py-3.5 text-sm font-bold text-ink-muted transition-colors hover:text-ink"
                >
                  {t('babies.wizard.back')}
                </button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('common.saving') : t('babies.form.submit')}
                </Button>
              </div>
              {createBaby.isError && (
                <p role="alert" className="text-destructive mt-4 text-sm">
                  {t('babies.form.genericError')}
                </p>
              )}
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
