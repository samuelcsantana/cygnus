import type { Baby } from '@/features/babies/api/babies.schemas'
import type { MilestoneCategory } from '../api/milestones.schemas'
import { MilestoneEditorDialog } from './MilestoneEditorDialog'
export function AddMilestoneDialog({
  open,
  onOpenChange,
  suggestion,
  babies,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  suggestion?: { title: string; category: MilestoneCategory }
  babies?: Baby[]
}) {
  return open ? (
    <MilestoneEditorDialog
      providedBabies={babies}
      onOpenChange={onOpenChange}
      suggestion={suggestion}
    />
  ) : null
}
