import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { soleBaby, useBabies } from '@/features/babies/api/babies.hooks'
import { todayDateString } from '@/lib/date'
import { BabyPickerStep } from '@/shared/components/BabyPickerStep'
import { CloseIcon } from '@/shared/icons/close-icon'
import { HeartIcon } from '@/shared/icons/heart-icon'

import { useCreateMedication } from '../api/medications.hooks'
import { medicationFormSchema, type MedicationFormInput } from '../api/medications.schemas'
import { MedicationFields } from './MedicationFields'
import { MedicationRecordNotice } from './MedicationRecordNotice'

interface AddMedicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddMedicationDialog({ open, onOpenChange }: AddMedicationDialogProps) {
  const { t } = useTranslation()
  const babies = useBabies()
  const babyList = babies.data ?? []

  const [step, setStep] = useState<'baby' | 'form'>('form')
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null)
  const createMedication = useCreateMedication(selectedBabyId)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MedicationFormInput>({
    resolver: zodResolver(medicationFormSchema),
    // Hoje como padrão para o início: quem registra um remédio quase sempre acabou de recebê-lo.
    defaultValues: { name: '', dosage: '', frequency: '', startedOn: todayDateString(), endedOn: '' },
  })

  // Reset só na abertura — não a cada mudança de `babies.data` — para que uma consulta que
  // responde tarde não apague o que a pessoa já digitou com o diálogo aberto.
  useEffect(() => {
    if (!open) return
    reset({ name: '', dosage: '', frequency: '', startedOn: todayDateString(), endedOn: '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const sole = soleBaby(babies.data)
    setSelectedBabyId(sole?.id ?? null)
    setStep(babyList.length > 1 ? 'baby' : 'form')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, babies.data])

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createMedication.mutateAsync(values)
    } catch {
      return // a mensagem aparece abaixo, a partir de createMedication.isError
    }
    toast.success(t('medications.form.successToast'))
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-h-[85vh] overflow-y-auto p-0 sm:max-w-2xl">
        <div className="relative bg-gradient-to-br from-sky-800 to-sky-700 px-7 pt-7 pb-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('common.close')}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
          <HeartIcon className="mb-2 h-8 w-8 text-white" />
          <DialogTitle className="font-display text-xl font-extrabold text-white">
            {t('medications.form.createTitle')}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-white/80">
            {t('medications.form.createSubtitle')}
          </DialogDescription>
        </div>

        <div className="p-7">
          {step === 'baby' ? (
            <div key="baby" className="animate-fade-in-up">
              <BabyPickerStep babies={babyList} value={selectedBabyId} onSelect={setSelectedBabyId} />
              <div className="mt-6 flex items-center justify-end gap-4 border-t border-border pt-6">
                <Button type="button" disabled={!selectedBabyId} onClick={() => setStep('form')}>
                  {t('medications.wizard.continue')}
                </Button>
              </div>
            </div>
          ) : (
            <form key="form" onSubmit={onSubmit} noValidate className="animate-fade-in-up">
              {/* Repetido aqui, e não só no topo da rota: é neste diálogo que alguém digita
                  "5 gotas, 1x ao dia", e é aqui que a leitura de "instrução" é mais provável. */}
              <MedicationRecordNotice className="mb-6" />

              <MedicationFields register={register} control={control} errors={errors} />

              {createMedication.isError && (
                <p role="alert" className="text-destructive mt-4 text-sm">
                  {t('medications.form.genericError')}
                </p>
              )}

              <div className="mt-6 flex items-center justify-end gap-4 border-t border-border pt-6">
                {babyList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep('baby')}
                    className="px-6 py-3.5 text-sm font-bold text-ink-muted transition-colors hover:text-ink"
                  >
                    {t('medications.wizard.back')}
                  </button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('common.saving') : t('medications.form.submit')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
