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
import { useAppointments } from '@/features/appointments/api/appointments.hooks'
import { growthSeries } from '@/features/growth/api/growth.selectors'
import { useDeleteBaby, useUpdateBaby } from '../api/babies.hooks'
import type { Baby } from '../api/babies.schemas'
import { BabyEditorDialog } from './BabyEditorDialog'
import { GuardiansSection } from './GuardiansSection'

export function EditBabyDialog({
  baby,
  onOpenChange,
}: {
  baby: Baby | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const updateBaby = useUpdateBaby(baby?.id ?? '')
  const deleteBaby = useDeleteBaby()
  const appointments = useAppointments(baby?.id ?? null)
  if (!baby) return null
  return (
    <BabyEditorDialog
      key={baby.id}
      open
      baby={baby}
      onOpenChange={onOpenChange}
      busy={deleteBaby.isPending}
      latestMeasurement={growthSeries(appointments.data ?? [], baby.birthDate, baby.measurements).at(-1)}
      onSave={async (values) => {
        await updateBaby.mutateAsync(values)
        toast.success(t('babies.edit.successToast'))
        onOpenChange(false)
      }}
      management={
        <>
          <GuardiansSection babyId={baby.id} babyName={baby.name} />
          <details className="rounded-2xl border border-border p-4">
            <summary className="cursor-pointer text-sm font-bold text-destructive">
              {t('babies.delete.sectionTitle')}
            </summary>
            <p className="my-4 text-sm text-ink-muted">{t('babies.delete.sectionDescription')}</p>
            {deleteBaby.isError && (
              <p role="alert" className="mb-3 text-sm text-destructive">
                {t('babies.delete.genericError')}
              </p>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="sm">
                  {t('babies.delete.action', { name: baby.name })}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('babies.delete.confirmTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('babies.delete.confirmDescription', { name: baby.name })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('babies.delete.confirmDismiss')}</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={deleteBaby.isPending}
                    onClick={() =>
                      deleteBaby.mutate(baby.id, {
                        onSuccess: () => {
                          toast.success(t('babies.delete.successToast'))
                          onOpenChange(false)
                        },
                      })
                    }
                  >
                    {t('babies.delete.confirmAction')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </details>
        </>
      }
    />
  )
}
