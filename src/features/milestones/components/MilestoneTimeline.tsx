import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { formatDateDisplay } from '@/lib/date'
import { cn } from '@/lib/utils'
import { PencilIcon } from '@/shared/icons/pencil-icon'

import type { Milestone } from '../api/milestones.schemas'
import { MILESTONE_CATEGORY_META } from './category-meta'
import { EditMilestoneDialog } from './EditMilestoneDialog'

interface MilestoneTimelineProps {
  babyId: string
  birthDate: string
  items: Milestone[]
}

export function MilestoneTimeline({ babyId, birthDate, items }: MilestoneTimelineProps) {
  const { t, i18n } = useTranslation()
  const [editTarget, setEditTarget] = useState<Milestone | null>(null)

  return (
    <div className="relative ml-4 max-w-3xl sm:ml-8">
      <div className="absolute top-6 bottom-6 left-6 w-1 rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-200 opacity-50" />

      <div className="space-y-10">
        {items.map((milestone) => {
          const meta = MILESTONE_CATEGORY_META[milestone.category]
          return (
            <div key={milestone.id} className="group relative flex items-start">
              <div
                className={cn(
                  'absolute left-6 z-10 -ml-[1.65rem] flex h-14 w-14 items-center justify-center rounded-2xl border-2 bg-white text-2xl shadow-sm transition-all duration-300 group-hover:scale-110',
                  meta.accentClass,
                )}
              >
                {meta.emoji}
              </div>

              <div className="relative ml-20 w-full rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 group-hover:border-slate-200 group-hover:shadow-md">
                <button
                  type="button"
                  onClick={() => setEditTarget(milestone)}
                  aria-label={t('milestones.edit.action', { title: milestone.title })}
                  className="absolute top-6 right-6 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>

                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 pr-8">
                  <span className={cn('inline-block rounded-lg px-3 py-1 text-xs font-bold', meta.badgeClass)}>
                    {formatDateDisplay(milestone.achievedAt, i18n.language)}
                  </span>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-bold', meta.badgeClass)}>
                    {t(`milestones.category.${milestone.category.toLowerCase()}`)}
                  </span>
                </div>
                <h3 className="mb-2 text-2xl font-bold text-slate-900">{milestone.title}</h3>
                {milestone.description && (
                  <p className="text-base leading-relaxed font-medium text-slate-600">{milestone.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <EditMilestoneDialog
        babyId={babyId}
        birthDate={birthDate}
        milestone={editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      />
    </div>
  )
}
