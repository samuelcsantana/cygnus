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
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CloseIcon } from '@/shared/icons/close-icon'
import { PencilIcon } from '@/shared/icons/pencil-icon'
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
      <DialogContent showCloseButton={false} className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-lg lg:max-w-3xl">
        <div className="relative bg-gradient-to-br from-teal-500 to-teal-400 px-7 pt-7 pb-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('common.close')}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
          <PencilIcon className="mb-2 h-8 w-8 text-white" />
          <h2 className="font-display text-xl font-extrabold text-white">{t('babies.edit.title')}</h2>
          {baby && <p className="mt-1 text-sm text-white/80">{baby.name}</p>}
        </div>

        {baby && (
          <div className="p-7">
            <BabyForm
              defaultValues={{
                name: baby.name,
                birthDate: baby.birthDate,
                gender: baby.gender,
                bloodType: baby.bloodType ?? undefined,
                allergies: baby.allergies,
                avatarUrl: baby.avatarUrl ?? '',
                avatarColor: baby.avatarColor ?? '',
              }}
              submitLabel={t('babies.edit.submit')}
              showCancel
              onCancel={() => onOpenChange(false)}
              onSubmit={async (values) => {
                await updateBaby.mutateAsync(values)
                onOpenChange(false)
              }}
              dangerZone={
                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5">
                  <h3 className="font-display mb-1 text-sm font-extrabold text-ink">
                    {t('babies.delete.sectionTitle')}
                  </h3>
                  <p className="mb-4 text-xs text-ink-muted">{t('babies.delete.sectionDescription')}</p>

                  {deleteBaby.isError && (
                    <p role="alert" className="text-destructive mb-3 text-xs">
                      {t('babies.delete.genericError')}
                    </p>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" size="sm">
                        <TrashIcon className="h-3.5 w-3.5" />
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
              }
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
