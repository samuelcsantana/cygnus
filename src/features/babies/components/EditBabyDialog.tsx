import { useTranslation } from 'react-i18next'

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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TrashIcon } from '@/shared/icons/trash-icon'

import { useDeleteBaby, useUpdateBaby } from '../api/babies.hooks'
import type { Baby } from '../api/babies.schemas'
import { BabyForm } from './BabyForm'

interface EditBabyDialogProps {
  baby: Baby | null
  onOpenChange: (open: boolean) => void
}

export function EditBabyDialog({ baby, onOpenChange }: EditBabyDialogProps) {
  const { t } = useTranslation()
  const updateBaby = useUpdateBaby(baby?.id ?? '')
  const deleteBaby = useDeleteBaby()

  return (
    <Dialog open={!!baby} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('babies.edit.title')}</DialogTitle>
        </DialogHeader>

        {baby && (
          <>
            <BabyForm
              defaultValues={{
                name: baby.name,
                birthDate: baby.birthDate,
                gender: baby.gender,
                bloodType: baby.bloodType ?? undefined,
                allergies: baby.allergies,
                avatarUrl: baby.avatarUrl ?? '',
              }}
              submitLabel={t('babies.edit.submit')}
              showCancel
              onCancel={() => onOpenChange(false)}
              onSubmit={async (values) => {
                await updateBaby.mutateAsync(values)
                onOpenChange(false)
              }}
            />

            <div className="mt-6 border-t border-slate-100 pt-6">
              {deleteBaby.isError && (
                <p role="alert" className="text-destructive mb-3 text-sm">
                  {t('babies.delete.genericError')}
                </p>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="text-destructive hover:text-destructive/80 flex items-center gap-2 text-sm font-bold transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                    {t('babies.delete.action', { name: baby.name })}
                  </button>
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
                      onClick={() => {
                        deleteBaby.mutate(baby.id, { onSuccess: () => onOpenChange(false) })
                      }}
                      disabled={deleteBaby.isPending}
                    >
                      {t('babies.delete.confirmAction')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
