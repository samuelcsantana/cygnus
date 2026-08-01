import { useTranslation } from 'react-i18next'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { useUpdateBaby } from '../api/babies.hooks'
import type { Baby } from '../api/babies.schemas'
import { BabyForm } from './BabyForm'

interface EditBabyDialogProps {
  baby: Baby | null
  onOpenChange: (open: boolean) => void
}

export function EditBabyDialog({ baby, onOpenChange }: EditBabyDialogProps) {
  const { t } = useTranslation()
  const updateBaby = useUpdateBaby(baby?.id ?? '')

  return (
    <Dialog open={!!baby} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('babies.edit.title')}</DialogTitle>
        </DialogHeader>

        {baby && (
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
        )}
      </DialogContent>
    </Dialog>
  )
}
