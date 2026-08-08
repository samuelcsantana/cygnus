import { useState } from 'react'
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
import type { Baby } from '@/features/babies/api/babies.schemas'
import { formatDateDisplay } from '@/lib/date'
import { cn } from '@/lib/utils'
import { PencilIcon } from '@/shared/icons/pencil-icon'
import { TrashIcon } from '@/shared/icons/trash-icon'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

import { useDeleteMilestone } from '../api/milestones.hooks'
import type { Milestone } from '../api/milestones.schemas'
import { MILESTONE_CATEGORY_META } from './category-meta'
import { EditMilestoneDialog } from './EditMilestoneDialog'

interface MilestoneTimelineProps {
  items: Milestone[]
  babies: Baby[]
}

// A single, merged, household-wide timeline — each entry tagged with which
// baby it belongs to, so a family with several children sees one chronological
// story instead of one full timeline repeated per child.
export function MilestoneTimeline({ items, babies }: MilestoneTimelineProps) {
  const { i18n } = useTranslation()
  const [editTarget, setEditTarget] = useState<Milestone | null>(null)
  const babyById = new Map(babies.map((baby) => [baby.id, baby]))

  return (
    <div className="relative ml-5 max-w-3xl sm:ml-8">
      <div className="absolute top-5 bottom-5 left-5 w-0.5 bg-slate-200" />

      <div className="space-y-4">
        {items.map((milestone) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            baby={babyById.get(milestone.babyId)}
            locale={i18n.language}
            onEdit={() => setEditTarget(milestone)}
          />
        ))}
      </div>

      <EditMilestoneDialog
        babies={babies}
        milestone={editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      />
    </div>
  )
}

interface MilestoneCardProps {
  milestone: Milestone
  baby: Baby | undefined
  locale: string
  onEdit: () => void
}

function MilestoneCard({ milestone, baby, locale, onEdit }: MilestoneCardProps) {
  const { t } = useTranslation()
  const deleteMilestone = useDeleteMilestone(milestone.babyId)
  const meta = MILESTONE_CATEGORY_META[milestone.category]
  const avatarAppearance = baby ? babyAvatarAppearance(baby.id, baby.avatarColor) : null

  // Radix's AlertDialogAction always closes the alert dialog immediately on
  // click, before this async handler settles — so a failure can't be shown
  // inline inside the (already-unmounted) AlertDialogContent; a toast is the
  // only reliable way to surface it.
  const handleDelete = async () => {
    try {
      await deleteMilestone.mutateAsync(milestone.id)
      toast.success(t('milestones.delete.successToast'))
    } catch {
      toast.error(t('milestones.delete.genericError'))
    }
  }

  return (
    <div className="group relative flex items-start gap-5">
      <div
        className={cn(
          'relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-[3px] bg-white text-base',
          meta.nodeClass,
        )}
      >
        {meta.emoji}
      </div>

      <div className="relative flex-1 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] sm:p-5">
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <h3 className="font-display text-[15px] font-extrabold text-ink">{milestone.title}</h3>
          <div className="flex flex-shrink-0 items-center gap-1">
            <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', meta.badgeClass)}>
              {t(`milestones.category.${milestone.category.toLowerCase()}`)}
            </span>
            <span className="text-xs text-ink-faint">{formatDateDisplay(milestone.achievedAt, locale)}</span>
            {/* Touch target: the visible icon stays small to match the tight
                header row, but the invisible -inset-3 pseudo-element pushes
                the tappable/clickable area to the WCAG 44x44px minimum
                without disturbing surrounding layout. Opacity is never fully
                0 by default (only dimmed) so the action stays discoverable
                on touch devices, which have no :hover state; keyboard focus
                and hover both bring it to full opacity. */}
            <span className="relative inline-flex">
              <button
                type="button"
                onClick={onEdit}
                aria-label={t('milestones.edit.action', { title: milestone.title })}
                className="relative text-ink-faint hover:text-ink rounded-lg p-1 opacity-60 transition-opacity hover:bg-slate-100 hover:opacity-100 focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100"
              >
                <span className="absolute -inset-3" aria-hidden="true" />
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
            </span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <span className="relative inline-flex">
                  <button
                    type="button"
                    aria-label={t('milestones.delete.action', { title: milestone.title })}
                    className="text-destructive relative rounded-lg p-1 opacity-60 transition-opacity hover:bg-rose-50 hover:opacity-100 focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100"
                  >
                    <span className="absolute -inset-3" aria-hidden="true" />
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </span>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('milestones.delete.confirmTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('milestones.delete.confirmDescription', { title: milestone.title })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('milestones.delete.confirmDismiss')}</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteMilestone.isPending}
                  >
                    {t('milestones.delete.confirmAction')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {baby && (
          <div className="mb-1.5 flex items-center gap-1.5">
            <span
              className={cn(
                'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[8px] font-black',
                avatarAppearance?.className,
              )}
              style={avatarAppearance?.style}
            >
              {babyInitials(baby.name)}
            </span>
            <span className="text-[11px] font-semibold text-ink-muted">{baby.name}</span>
          </div>
        )}
        {milestone.description && (
          <p className="text-[13px] leading-relaxed text-ink-muted">{milestone.description}</p>
        )}
      </div>
    </div>
  )
}
