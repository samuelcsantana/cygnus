import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { CloseIcon } from '@/shared/icons/close-icon'
import { PencilIcon } from '@/shared/icons/pencil-icon'
import { TrashIcon } from '@/shared/icons/trash-icon'

import { useDeleteMedication, useUpdateMedication } from '../api/medications.hooks'
import { medicationFormSchema, type Medication, type MedicationFormInput } from '../api/medications.schemas'
import { MedicationFields } from './MedicationFields'

interface EditMedicationDialogProps {
  medication: Medication | null
  onOpenChange: (open: boolean) => void
}

export function EditMedicationDialog({ medication, onOpenChange }: EditMedicationDialogProps) {
  const { t } = useTranslation()
  const updateMedication = useUpdateMedication(medication?.babyId ?? '')
  const deleteMedication = useDeleteMedication(medication?.babyId ?? '')

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MedicationFormInput>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: { name: '', startedOn: '', endedOn: '' },
  })

  useEffect(() => {
    if (!medication) return
    reset({
      name: medication.name,
      dosage: medication.dosage ?? '',
      frequency: medication.frequency ?? '',
      reason: medication.reason ?? '',
      prescriberName: medication.prescriberName ?? '',
      startedOn: medication.startedOn,
      // Vazio no formulário representa "sem fim registrado". Apagar a data aqui reabre o curso, que
      // é a leitura correta de alguém deletando a data que tinha digitado.
      endedOn: medication.endedOn ?? '',
      notes: medication.notes ?? '',
    })
  }, [medication, reset])

  const onSubmit = handleSubmit(async (values) => {
    if (!medication) return
    try {
      await updateMedication.mutateAsync({ medicationId: medication.id, input: values })
    } catch {
      return
    }
    toast.success(t('medications.form.updateSuccessToast'))
    onOpenChange(false)
  })

  return (
    <Dialog open={!!medication} onOpenChange={onOpenChange}>
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
          <PencilIcon className="mb-2 h-8 w-8 text-white" />
          <DialogTitle className="font-display text-xl font-extrabold text-white">
            {t('medications.form.editTitle')}
          </DialogTitle>
          {medication && (
            <DialogDescription className="mt-1 text-sm text-white/80">{medication.name}</DialogDescription>
          )}
        </div>

        {medication && (
          <div className="p-7">
            <form onSubmit={onSubmit} noValidate>
              <MedicationFields register={register} control={control} errors={errors} />

              {updateMedication.isError && (
                <p role="alert" className="text-destructive mt-4 text-sm">
                  {t('medications.form.genericError')}
                </p>
              )}

              <div className="mt-6 flex items-center justify-end gap-4 border-t border-border pt-6">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('common.saving') : t('medications.form.updateSubmit')}
                </Button>
              </div>
            </form>

            <div className="mt-6 flex justify-start border-t border-border pt-6">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" className="text-destructive" disabled={deleteMedication.isPending}>
                    <TrashIcon className="h-3.5 w-3.5" />
                    {t('medications.deleteAction')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('medications.deleteConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('medications.deleteConfirmDescription', { name: medication.name })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('medications.deleteConfirmDismiss')}</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => {
                        deleteMedication.mutate(medication.id, {
                          onSuccess: () => {
                            toast.success(t('medications.deleteSuccessToast'))
                            onOpenChange(false)
                          },
                          onError: () => toast.error(t('medications.form.genericError')),
                        })
                      }}
                    >
                      {t('medications.deleteConfirmAction')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
