import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useCreateBaby } from '../api/babies.hooks'
import { BabyEditorDialog } from './BabyEditorDialog'

export function AddBabyDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const createBaby = useCreateBaby()
  if (!open) return null
  return (
    <BabyEditorDialog
      open
      onOpenChange={onOpenChange}
      onSave={async (values) => {
        await createBaby.mutateAsync(values)
        toast.success(t('babies.form.successToast'))
        onOpenChange(false)
      }}
    />
  )
}
