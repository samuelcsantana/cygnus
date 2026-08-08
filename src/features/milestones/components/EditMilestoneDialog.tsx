import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { todayDateString } from '@/lib/date'

import { useUpdateMilestone } from '../api/milestones.hooks'
import type { Milestone } from '../api/milestones.schemas'
import { MilestoneForm } from './MilestoneForm'

interface EditMilestoneDialogProps {
  babies: Baby[]
  milestone: Milestone | null
  onOpenChange: (open: boolean) => void
}

export function EditMilestoneDialog({ babies, milestone, onOpenChange }: EditMilestoneDialogProps) {
  const { t } = useTranslation()
  const babyId = milestone?.babyId ?? ''
  const birthDate = babies.find((baby) => baby.id === babyId)?.birthDate ?? todayDateString()
  const updateMilestone = useUpdateMilestone(babyId, milestone?.id ?? '')

  return (
    <Dialog open={!!milestone} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('milestones.edit.title')}</DialogTitle>
        </DialogHeader>

        {milestone && (
          <MilestoneForm
            birthDate={birthDate}
            defaultValues={{
              title: milestone.title,
              description: milestone.description ?? undefined,
              achievedAt: milestone.achievedAt,
              category: milestone.category,
              photoUrl: milestone.photoUrl ?? '',
            }}
            submitLabel={t('milestones.edit.submit')}
            showCancel
            onCancel={() => onOpenChange(false)}
            onSubmit={async (values) => {
              await updateMilestone.mutateAsync(values)
              toast.success(t('milestones.edit.successToast'))
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
