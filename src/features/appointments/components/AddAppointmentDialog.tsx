import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { soleBaby, useBabies } from '@/features/babies/api/babies.hooks'
import { BabyPickerStep } from '@/shared/components/BabyPickerStep'
import { StepIndicator, type Step as StepIndicatorStep } from '@/shared/components/StepIndicator'
import { CloseIcon } from '@/shared/icons/close-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'

import { useCreateSpecialist } from '@/features/specialists/api/specialists.hooks'

import { useCreateAppointment } from '../api/appointments.hooks'
import { appointmentFormSchema, type AppointmentFormInput } from '../api/appointments.schemas'
import { AppointmentMeasurementFields } from './AppointmentMeasurementFields'
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
  const createSpecialist = useCreateSpecialist(selectedBabyId)

  const {
    register,
    control,
    handleSubmit,
    trigger,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormInput>({
    resolver: zodResolver(appointmentFormSchema),
    // Booking is where the wizard starts; recording the past is the deliberate
    // choice made on the schedule step.
    // `doctorName: ''` e não ausente: o campo é um input controlado, então seu estado vazio é a
    // string vazia. Sem isto o valor inicial é `undefined`, e o Zod reprova por tipo em vez de por
    // tamanho — a pessoa recebe a mensagem errada por um detalhe de inicialização.
    defaultValues: { status: 'SCHEDULED', doctorName: '' },
  })

  // Reset only when the dialog opens — not on every `babies.data` change —
  // so a late-resolving babies query doesn't wipe in-progress input/errors
  // out from under the user while the dialog is already open.
  useEffect(() => {
    if (!open) return
    // Back to booking, not to an empty intent — reset() with no argument would
    // clear the field the schema requires, and the second open would submit
    // without one.
    reset({ status: 'SCHEDULED', doctorName: '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const sole = soleBaby(babies.data)
    setSelectedBabyId(sole?.id ?? null)
    setStep(babyList.length > 1 ? 'baby' : 'professional')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, babies.data])

  const handleContinueFromProfessional = async () => {
    const isValid = await trigger('doctorName')
    if (isValid) {
      setStep('schedule')
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      // Sem este catch a rejeição vira unhandled rejection: o diálogo fica
      // aberto, o botão volta ao normal e nada é dito. A pessoa clica de novo,
      // e se a falha tiver sido parcial isso duplica o registro. Os formulários
      // compartilhados (BabyForm, MilestoneForm, AppointmentForm) já faziam
      // isto; os assistentes que têm formulário próprio ficaram de fora.
      // O profissional é salvo **antes** da consulta e só quando a pessoa pediu. Antes porque a
      // consulta precisa do id para guardar o vínculo; e se esta chamada falhar, o `catch` abaixo
      // impede que a consulta seja criada apontando para um especialista que não existe. O
      // contrário — consulta primeiro — deixaria a consulta gravada e o cadastro silenciosamente
      // não feito, que é a falha que ninguém percebe.
      const saved = values.saveSpecialist
        ? await createSpecialist.mutateAsync({ name: values.doctorName, specialty: values.specialty })
        : undefined

      await createAppointment.mutateAsync({ input: values, specialistId: saved?.id })
    } catch {
      return // a mensagem aparece abaixo, a partir de createAppointment.error
    }
    toast.success(t('appointments.form.successToast'))
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
          <DialogTitle className="font-display text-xl font-extrabold text-white">{t('appointments.form.createTitle')}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-white/80">{t('appointments.form.createSubtitle')}</DialogDescription>
        </div>

        <div className="p-7">
          <StepIndicator steps={steps} currentStepId={step} accentClassName="bg-violet-600" className="mb-6" />

          {step === 'baby' ? (
            <div key="baby" className="animate-fade-in-up">
              <BabyPickerStep babies={babyList} value={selectedBabyId} onSelect={setSelectedBabyId} />
              <div className="mt-6 flex items-center justify-end gap-4 border-t border-border pt-6">
                <Button type="button" disabled={!selectedBabyId} onClick={() => setStep('professional')}>
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
              <AppointmentProfessionalFields
                register={register}
                control={control}
                setValue={setValue}
                errors={errors}
                babyId={selectedBabyId}
              />
              <div className="mt-6 flex items-center justify-end gap-4 border-t border-border pt-6">
                <Button type="button" onClick={handleContinueFromProfessional}>
                  {t('appointments.wizard.continue')}
                </Button>
              </div>
            </div>
          ) : (
            <form key="schedule" onSubmit={onSubmit} noValidate className="animate-fade-in-up">
              <AppointmentScheduleFields register={register} control={control} errors={errors} />

              {/* Só depois de a pessoa dizer que a consulta já aconteceu. A API recusa medida em
                  visita futura, então oferecer o campo ao agendar seria pedir um dado que volta
                  como 400 — e não há o que a pessoa faça com esse erro. */}
              {watch('status') === 'COMPLETED' && (
                <div className="mt-6">
                  <AppointmentMeasurementFields register={register} errors={errors} />
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-4 border-t border-border pt-6">
                <button
                  type="button"
                  onClick={() => setStep('professional')}
                  className="px-6 py-3.5 text-sm font-bold text-ink-muted transition-colors hover:text-ink"
                >
                  {t('appointments.wizard.back')}
                </button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('common.saving') : t('appointments.form.submit')}
                </Button>
              </div>
              {createAppointment.isError && (
                <p role="alert" className="text-destructive mt-4 text-sm">
                  {t('appointments.form.genericError')}
                </p>
              )}
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
