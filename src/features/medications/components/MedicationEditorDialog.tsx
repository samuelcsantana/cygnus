import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { useBabies } from '@/features/babies/api/babies.hooks'
import { useSpecialistsForBaby } from '@/features/specialists/api/specialists.hooks'
import { todayDateString, formatDateDisplay } from '@/lib/date'
import { BabyPickerStep } from '@/shared/components/BabyPickerStep'
import {
  useCreateMedication,
  useUpdateMedication,
  useDeleteMedication,
} from '../api/medications.hooks'
import {
  medicationFormSchema,
  type Medication,
  type MedicationFormInput,
} from '../api/medications.schemas'
import { MedicationDialogLayout } from './MedicationDialogLayout'
import { MedicationFields } from './MedicationFields'
import { MedicationRecordNotice } from './MedicationRecordNotice'

type Step = 'baby' | 'medicine' | 'details'
export function MedicationEditorDialog({
  medication,
  onOpenChange,
}: {
  medication?: Medication
  onOpenChange: (open: boolean) => void
}) {
  const { t, i18n } = useTranslation()
  const babies = useBabies()
  const babyList = babies.data ?? []
  const [babyId, setBabyId] = useState<string | null>(medication?.babyId ?? null)
  const [step, setStep] = useState<Step>(medication ? 'medicine' : 'baby')
  const initialized = useRef(!!medication)
  useEffect(() => {
    if (initialized.current || !babies.isSuccess) return
    initialized.current = true
    if (babies.data.length === 1) {
      setBabyId(babies.data[0]!.id)
      setStep('medicine')
    }
  }, [babies.data, babies.isSuccess])
  const baby = babyList.find((item) => item.id === babyId)
  const specialists = useSpecialistsForBaby(babyId)
  const create = useCreateMedication(babyId)
  const update = useUpdateMedication(babyId ?? '')
  const remove = useDeleteMedication(babyId ?? '')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [error, setError] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  const {
    register,
    control,
    trigger,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<MedicationFormInput>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: {
      name: medication?.name ?? '',
      dosage: medication?.dosage ?? '',
      frequency: medication?.frequency ?? '',
      startedOn: medication?.startedOn ?? todayDateString(),
      endedOn: medication?.endedOn ?? '',
      reason: medication?.reason ?? '',
      prescriberName: medication?.prescriberName ?? '',
      notes: medication?.notes ?? '',
    },
  })
  const [name, dosage, frequency, startedOn, endedOn] = useWatch({
    control,
    name: ['name', 'dosage', 'frequency', 'startedOn', 'endedOn'],
  })
  const busy = isSubmitting || create.isPending || update.isPending || remove.isPending
  const save = handleSubmit(
    async (values) => {
      if (!babyId || busy) return
      setError(false)
      try {
        if (medication) await update.mutateAsync({ medicationId: medication.id, input: values })
        else await create.mutateAsync(values)
      } catch {
        setError(true)
        return
      }
      toast.success(
        t(medication ? 'medications.form.updateSuccessToast' : 'medications.form.successToast'),
      )
      onOpenChange(false)
    },
    (invalid) => setStep(invalid.name ? 'medicine' : 'details'),
  )
  const deleteRecord = async () => {
    if (!medication || busy) return
    setDeleteError(false)
    try {
      await remove.mutateAsync(medication.id)
    } catch {
      setDeleteError(true)
      return
    }
    toast.success(t('medications.deleteSuccessToast'))
    onOpenChange(false)
  }
  const period = startedOn
    ? `${formatDateDisplay(startedOn, i18n.language)} · ${endedOn ? formatDateDisplay(endedOn, i18n.language) : t('medications.editor.noEnd')}`
    : undefined
  return (
    <>
      <MedicationDialogLayout
        open
        onOpenChange={onOpenChange}
        title={t(medication ? 'medications.form.editTitle' : 'medications.form.createTitle')}
        baby={baby}
        medicine={name}
        dosage={dosage}
        frequency={frequency}
        date={period}
        stage={step}
        dirty={isDirty}
        busy={busy}
        progress={
          <ol className="flex flex-wrap gap-x-5 gap-y-2">
            {(['medicine', 'details'] as const).map((item, index) => (
              <li
                key={item}
                aria-current={step === item ? 'step' : undefined}
                className={`text-sm font-semibold ${step === item ? 'text-sky-800 dark:text-sky-300' : 'text-ink-muted'}`}
              >
                <span className="mr-2 text-xs">0{index + 1}</span>
                {t(`medications.editor.${item}`)}
              </li>
            ))}
          </ol>
        }
        footer={(close) => (
          <>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                if (step === 'details') setStep('medicine')
                else if (step === 'medicine' && !medication && babyList.length > 1) setStep('baby')
                else close()
              }}
            >
              {t(
                step === 'details' || (step === 'medicine' && !medication && babyList.length > 1)
                  ? 'medications.wizard.back'
                  : 'common.cancel',
              )}
            </Button>
            {step === 'details' ? (
              <Button
                key="save"
                type="submit"
                form="medication-editor-form"
                disabled={busy || !babyId}
                className="bg-sky-800 text-white hover:bg-sky-900"
              >
                {t(
                  busy
                    ? 'common.saving'
                    : medication
                      ? 'medications.form.updateSubmit'
                      : 'medications.form.submit',
                )}
              </Button>
            ) : (
              <Button
                key="continue"
                type="button"
                disabled={busy || !babyId || !babies.isSuccess}
                className="bg-sky-800 text-white hover:bg-sky-900"
                onClick={async () => {
                  if (step === 'baby') setStep('medicine')
                  else if (await trigger('name', { shouldFocus: true })) setStep('details')
                }}
              >
                {t('medications.wizard.continue')}
              </Button>
            )}
          </>
        )}
      >
        {babies.isPending ? (
          <p role="status">{t('common.loading')}</p>
        ) : babies.isError ? (
          <div role="alert" className="space-y-3">
            <p>{t('medications.editor.childrenError')}</p>
            <Button
              type="button"
              onClick={() => {
                void babies.refetch()
              }}
            >
              {t('medications.editor.retry')}
            </Button>
          </div>
        ) : !babyList.length ? (
          <p>{t('medications.editor.noChildren')}</p>
        ) : step === 'baby' ? (
          <BabyPickerStep babies={babyList} value={babyId} onSelect={setBabyId} />
        ) : (
          <>
            <form
              id="medication-editor-form"
              onSubmit={(event) => {
                if (step === 'medicine') {
                  event.preventDefault()
                  void trigger('name', { shouldFocus: true }).then((valid) => {
                    if (valid) setStep('details')
                  })
                } else void save(event)
              }}
              noValidate
              className="space-y-5"
            >
              {step === 'medicine' && <MedicationRecordNotice />}
              <MedicationFields
                register={register}
                control={control}
                errors={errors}
                section={step}
                prescribers={specialists.data?.map((person) => person.name)}
              />
              {step === 'details' && specialists.isPending && (
                <p role="status" className="text-sm text-ink-muted">
                  {t('medications.editor.loadingPrescribers')}
                </p>
              )}
              {step === 'details' && specialists.isError && (
                <div role="alert" className="space-y-2 text-sm">
                  <p>{t('medications.editor.prescribersError')}</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void specialists.refetch()
                    }}
                  >
                    {t('medications.editor.retry')}
                  </Button>
                </div>
              )}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {t('medications.form.genericError')}
                </p>
              )}
            </form>
            {medication && step === 'details' && (
              <div className="mt-6 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive"
                  disabled={busy}
                  onClick={() => {
                    setDeleteError(false)
                    setDeleteOpen(true)
                  }}
                >
                  {t('medications.deleteAction')}
                </Button>
              </div>
            )}
          </>
        )}
      </MedicationDialogLayout>
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!busy) setDeleteOpen(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('medications.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('medications.deleteConfirmDescription', { name: medication?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-destructive">
              {t('medications.form.genericError')}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              {t('medications.deleteConfirmDismiss')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy}
              onClick={(event) => {
                event.preventDefault()
                void deleteRecord()
              }}
            >
              {t(busy ? 'common.saving' : 'medications.deleteConfirmAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
