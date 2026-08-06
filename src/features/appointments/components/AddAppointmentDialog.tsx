import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { soleBaby, useBabies } from '@/features/babies/api/babies.hooks'
import { BabyPickerStep } from '@/shared/components/BabyPickerStep'
import { StepIndicator, type Step as StepIndicatorStep } from '@/shared/components/StepIndicator'
import { CloseIcon } from '@/shared/icons/close-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'

import { useCreateAppointment } from '../api/appointments.hooks'
import { appointmentFormSchema, type AppointmentFormInput } from '../api/appointments.schemas'
import { AppointmentProfessionalFields } from './AppointmentProfessionalFields'
import { AppointmentScheduleFields } from './AppointmentScheduleFields'

type Step = 'baby' | 'professional' | 'schedule'

interface AddAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddAppointmentDialog({ open, onOpenChange }: AddAppointmentDialogProps) {
  const { t } = useTranslation()
  const babies = useBabies()
  const babyList = babies.data ?? []
  const needsBabyPicker = babyList.length > 1

  const [step, setStep] = useState<Step>('professional')
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null)
  const createAppointment = useCreateAppointment(selectedBabyId)

  const {
    register,
    control,
    handleSubmit,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormInput>({
    resolver: zodResolver(appointmentFormSchema),
  })

  useEffect(() => {
    if (!open) return
    const sole = soleBaby(babies.data)
    setSelectedBabyId(sole?.id ?? null)
    setStep(babyList.length > 1 ? 'baby' : 'professional')
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, babies.data])

  const handleContinueFromProfessional = async () => {
    const isValid = await trigger('doctorName')
    if (isValid) {
      setStep('schedule')
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    await createAppointment.mutateAsync(values)
    onOpenChange(false)
  })

  const steps: StepIndicatorStep[] = [
    ...(needsBabyPicker ? [{ id: 'baby', label: t('babies.picker.stepLabel') }] : []),
    { id: 'professional', label: t('appointments.wizard.stepProfessional') },
    { id: 'schedule', label: t('appointments.wizard.stepSchedule') },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-h-[85vh] overflow-y-auto p-0 sm:max-w-lg">
        <div className="relative bg-gradient-to-br from-violet-600 to-violet-500 px-7 pt-7 pb-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('common.close')}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
          <StethoscopeIcon className="mb-2 h-8 w-8 text-white" />
          <h2 className="font-display text-xl font-extrabold text-white">{t('appointments.form.createTitle')}</h2>
          <p className="mt-1 text-sm text-white/80">{t('appointments.form.createSubtitle')}</p>
        </div>

        <div className="p-7">
          <StepIndicator steps={steps} currentStepId={step} accentClassName="bg-violet-600" className="mb-6" />

          {step === 'baby' ? (
            <div key="baby" className="animate-fade-in-up">
              <BabyPickerStep babies={babyList} value={selectedBabyId} onSelect={setSelectedBabyId} />
              <div className="mt-6 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
                <Button
                  type="button"
                  disabled={!selectedBabyId}
                  onClick={() => setStep('professional')}
                  className="bg-violet-600 text-white hover:bg-violet-700"
                >
                  {t('appointments.wizard.continue')}
                </Button>
              </div>
            </div>
          ) : step === 'professional' ? (
            // Deliberately not inside a <form>: a same-position button whose `type`
            // flips from "button" to "submit" on click (React reuses the DOM node)
            // can trigger a native submit on that very click if it's a form
            // descendant, even though the click handler itself never calls submit.
            <div key="professional" className="animate-fade-in-up">
              <AppointmentProfessionalFields register={register} control={control} errors={errors} />
              <div className="mt-6 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
                <Button
                  type="button"
                  onClick={handleContinueFromProfessional}
                  className="bg-violet-600 text-white hover:bg-violet-700"
                >
                  {t('appointments.wizard.continue')}
                </Button>
              </div>
            </div>
          ) : (
            <form key="schedule" onSubmit={onSubmit} noValidate className="animate-fade-in-up">
              <AppointmentScheduleFields register={register} control={control} errors={errors} />
              <div className="mt-6 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={() => setStep('professional')}
                  className="px-6 py-3.5 text-sm font-bold text-ink-muted transition-colors hover:text-ink"
                >
                  {t('appointments.wizard.back')}
                </button>
                <Button type="submit" disabled={isSubmitting} className="bg-violet-600 text-white hover:bg-violet-700">
                  {isSubmitting ? t('common.saving') : t('appointments.form.submit')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
