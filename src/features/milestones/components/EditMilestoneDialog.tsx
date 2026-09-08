import type { Baby } from '@/features/babies/api/babies.schemas'
import type { Milestone } from '../api/milestones.schemas'
import { MilestoneEditorDialog } from './MilestoneEditorDialog'
export function EditMilestoneDialog({ babies, milestone, onOpenChange }: { babies: Baby[]; milestone: Milestone | null; onOpenChange: (open: boolean) => void }) {
  return milestone ? <MilestoneEditorDialog key={milestone.id} providedBabies={babies} milestone={milestone} onOpenChange={onOpenChange} /> : null
}
