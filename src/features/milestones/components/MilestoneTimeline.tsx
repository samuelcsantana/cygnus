import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { formatDateDisplay } from '@/lib/date'
import { cn } from '@/lib/utils'
import { PencilIcon } from '@/shared/icons/pencil-icon'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

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
  const { t, i18n } = useTranslation()
  const [editTarget, setEditTarget] = useState<Milestone | null>(null)
  const babyById = new Map(babies.map((baby) => [baby.id, baby]))

  return (
    <div className="relative ml-5 max-w-3xl sm:ml-8">
      <div className="absolute top-5 bottom-5 left-5 w-0.5 bg-slate-200" />

      <div className="space-y-4">
        {items.map((milestone) => {
          const meta = MILESTONE_CATEGORY_META[milestone.category]
          const baby = babyById.get(milestone.babyId)
          const avatarAppearance = baby ? babyAvatarAppearance(baby.id, baby.avatarColor) : null
          return (
            <div key={milestone.id} className="group relative flex items-start gap-5">
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
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', meta.badgeClass)}>
                      {t(`milestones.category.${milestone.category.toLowerCase()}`)}
                    </span>
                    <span className="text-xs text-ink-faint">{formatDateDisplay(milestone.achievedAt, i18n.language)}</span>
                    <button
                      type="button"
                      onClick={() => setEditTarget(milestone)}
                      aria-label={t('milestones.edit.action', { title: milestone.title })}
                      className="text-ink-faint hover:text-ink rounded-lg p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-100"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
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
        })}
      </div>

      <EditMilestoneDialog
        babies={babies}
        milestone={editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      />
    </div>
  )
}
