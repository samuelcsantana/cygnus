import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { soleBaby, useBabies } from '@/features/babies/api/babies.hooks'
import { todayDateString } from '@/lib/date'
import { BabyPickerStep } from '@/shared/components/BabyPickerStep'
import { StepIndicator, type Step as StepIndicatorStep } from '@/shared/components/StepIndicator'
import { CloseIcon } from '@/shared/icons/close-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'

import { useCreateMilestone } from '../api/milestones.hooks'
import { createMilestoneFormSchema, type MilestoneFormInput } from '../api/milestones.schemas'
import { MilestoneCoreFields } from './MilestoneCoreFields'
import { MilestoneDetailFields } from './MilestoneDetailFields'

type Step = 'baby' | 'core' | 'details'

interface AddMilestoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddMilestoneDialog({ open, onOpenChange }: AddMilestoneDialogProps) {
  const { t } = useTranslation()
  const babies = useBabies()
  const babyList = babies.data ?? []
  const needsBabyPicker = babyList.length > 1

  const [step, setStep] = useState<Step>('core')
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null)
  const createMilestone = useCreateMilestone(selectedBabyId)

  const birthDate = babyList.find((baby) => baby.id === selectedBabyId)?.birthDate ?? todayDateString()
  const schema = useMemo(() => createMilestoneFormSchema(birthDate), [birthDate])

  const {
    register,
    control,
    handleSubmit,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MilestoneFormInput>({
    resolver: zodResolver(schema),
    defaultValues: { photoUrl: '' },
  })

  // Reset only when the dialog opens — not on every `babies.data` change —
  // so a late-resolving babies query doesn't wipe in-progress input/errors
  // out from under the user while the dialog is already open.
  useEffect(() => {
    if (!open) return
    reset({ photoUrl: '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const sole = soleBaby(babies.data)
    setSelectedBabyId(sole?.id ?? null)
    setStep(babyList.length > 1 ? 'baby' : 'core')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, babies.data])

  const handleContinueFromCore = async () => {
    const isValid = await trigger(['category', 'title', 'achievedAt'])
    if (isValid) {
      setStep('details')
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    await createMilestone.mutateAsync(values)
    toast.success(t('milestones.form.successToast'))
    onOpenChange(false)
  })

  const steps: StepIndicatorStep[] = [
    ...(needsBabyPicker ? [{ id: 'baby', label: t('babies.picker.stepLabel') }] : []),
    { id: 'core', label: t('milestones.wizard.stepCore') },
    { id: 'details', label: t('milestones.wizard.stepDetails') },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-h-[85vh] overflow-y-auto p-0 sm:max-w-2xl">
        <div className="relative bg-gradient-to-br from-amber-700 to-amber-600 px-7 pt-7 pb-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('common.close')}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
          <SparkleIcon className="mb-2 h-8 w-8 text-white" />
          <h2 className="font-display text-xl font-extrabold text-white">{t('milestones.form.createTitle')}</h2>
          <p className="mt-1 text-sm text-white/80">{t('milestones.form.createSubtitle')}</p>
        </div>

        <div className="p-7">
          <StepIndicator steps={steps} currentStepId={step} accentClassName="bg-amber-700" className="mb-6" />

          {step === 'baby' ? (
            <div key="baby" className="animate-fade-in-up">
              <BabyPickerStep babies={babyList} value={selectedBabyId} onSelect={setSelectedBabyId} />
              <div className="mt-6 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
                <Button
                  type="button"
                  disabled={!selectedBabyId}
                  onClick={() => setStep('core')}
                  className="bg-amber-700 text-white hover:bg-amber-800"
                >
                  {t('milestones.wizard.continue')}
                </Button>
              </div>
            </div>
          ) : step === 'core' ? (
            // Deliberately not inside a <form>: a same-position button whose `type`
            // flips from "button" to "submit" on click (React reuses the DOM node)
            // can trigger a native submit on that very click if it's a form
            // descendant, even though the click handler itself never calls submit.
            <div key="core" className="animate-fade-in-up">
              <MilestoneCoreFields control={control} register={register} errors={errors} />
              <div className="mt-6 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
                <Button
                  type="button"
                  onClick={handleContinueFromCore}
                  className="bg-amber-700 text-white hover:bg-amber-800"
                >
                  {t('milestones.wizard.continue')}
                </Button>
              </div>
            </div>
          ) : (
            <form key="details" onSubmit={onSubmit} noValidate className="animate-fade-in-up">
              <MilestoneDetailFields register={register} control={control} errors={errors} />
              <div className="mt-6 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={() => setStep('core')}
                  className="px-6 py-3.5 text-sm font-bold text-ink-muted transition-colors hover:text-ink"
                >
                  {t('milestones.wizard.back')}
                </button>
                <Button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white hover:bg-slate-800">
                  {isSubmitting ? t('common.saving') : t('milestones.form.submit')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
