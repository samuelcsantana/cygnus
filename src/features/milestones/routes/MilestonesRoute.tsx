import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

import { useBabies } from '@/features/babies/api/babies.hooks'
import { useEffectiveBabyId } from '@/hooks/useEffectiveBabyId'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/shared/components/EmptyState'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'

import { useMilestones } from '../api/milestones.hooks'
import type { MilestoneCategory } from '../api/milestones.schemas'
import { AddMilestoneDialog } from '../components/AddMilestoneDialog'
import { MILESTONE_CATEGORY_META } from '../components/category-meta'
import { MilestoneTimeline } from '../components/MilestoneTimeline'
import { MilestoneTimelineSkeleton } from '../components/MilestoneTimelineSkeleton'

const CATEGORIES: MilestoneCategory[] = ['MOTOR', 'LANGUAGE', 'SOCIAL', 'COGNITIVE', 'OTHER']

export function MilestonesRoute() {
  const { t } = useTranslation()
  const babyId = useEffectiveBabyId()
  const babies = useBabies()
  const milestones = useMilestones(babyId)
  const [activeCategory, setActiveCategory] = useState<MilestoneCategory | 'ALL'>('ALL')
  const [isAddOpen, setIsAddOpen] = useState(false)

  if (!babyId) {
    return <Navigate to="/dashboard" replace />
  }

  const baby = babies.data?.find((candidate) => candidate.id === babyId)
  const items = milestones.data ?? []
  const filteredItems = activeCategory === 'ALL' ? items : items.filter((item) => item.category === activeCategory)

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-ink">
            {baby ? t('milestones.titleWithBaby', { name: baby.name }) : t('milestones.title')}
          </h2>
          <p className="mt-1 text-lg text-ink-muted">{t('milestones.summary', { count: items.length })}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center justify-center rounded-2xl bg-amber-700 px-6 py-3 font-bold text-white shadow-lg shadow-amber-900/10 transition-all hover:bg-amber-800 active:scale-[0.98]"
        >
          {t('milestones.action')}
        </button>
      </div>

      {milestones.isPending ? (
        <MilestoneTimelineSkeleton />
      ) : milestones.isError ? (
        <p className="text-ink-muted py-16 text-center">{t('milestones.genericError')}</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<SparkleIcon className="h-10 w-10" />}
          title={t('milestones.empty.title')}
          description={t('milestones.empty.description')}
          action={
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-amber-700 px-6 py-3 font-bold text-white shadow-md shadow-amber-900/10 transition-colors hover:bg-amber-800"
            >
              {t('milestones.empty.cta')}
            </button>
          }
        />
      ) : baby ? (
        <>
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory('ALL')}
              className={cn(
                'rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors',
                activeCategory === 'ALL' ? 'bg-primary text-white' : 'bg-white text-ink-muted shadow-sm hover:bg-slate-50',
              )}
            >
              {t('milestones.filterAll')}
            </button>
            {CATEGORIES.map((category) => {
              const meta = MILESTONE_CATEGORY_META[category]
              const isActive = activeCategory === category
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors',
                    isActive ? meta.solidClass : 'bg-white text-ink-muted shadow-sm hover:bg-slate-50',
                  )}
                >
                  {meta.emoji} {t(`milestones.category.${category.toLowerCase()}`)}
                </button>
              )
            })}
          </div>

          <MilestoneTimeline babyId={babyId} birthDate={baby.birthDate} items={filteredItems} />
        </>
      ) : null}

      {baby && (
        <AddMilestoneDialog babyId={babyId} birthDate={baby.birthDate} open={isAddOpen} onOpenChange={setIsAddOpen} />
      )}
    </div>
  )
}
