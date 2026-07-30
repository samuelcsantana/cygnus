import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'

import { useBabies } from '@/features/babies/api/babies.hooks'
import { useEffectiveBabyId } from '@/hooks/useEffectiveBabyId'
import { EmptyState } from '@/shared/components/EmptyState'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'

import { useMilestones } from '../api/milestones.hooks'
import { MilestoneTimeline } from '../components/MilestoneTimeline'

export function MilestonesRoute() {
  const { t } = useTranslation()
  const babyId = useEffectiveBabyId()
  const babies = useBabies()
  const milestones = useMilestones(babyId)

  if (!babyId) {
    return <Navigate to="/dashboard" replace />
  }

  const baby = babies.data?.find((candidate) => candidate.id === babyId)
  const items = milestones.data ?? []

  return (
    <div className="animate-fade-in-up">
      <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-semibold tracking-wider text-amber-500 uppercase">
            {t('milestones.eyebrow')}
          </p>
          <h2 className="text-3xl font-extrabold text-slate-900">{t('milestones.title')}</h2>
          {baby && <p className="mt-1 text-lg text-slate-500">{baby.name}</p>}
        </div>
        <Link
          to="/milestones/new"
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-[0.98]"
        >
          {t('milestones.action')}
        </Link>
      </div>

      {milestones.isPending ? (
        <div className="flex justify-center py-16">
          <div className="border-t-transparent h-8 w-8 animate-spin rounded-full border-2 border-primary" />
        </div>
      ) : milestones.isError ? (
        <p className="py-16 text-center text-slate-500">{t('milestones.genericError')}</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<SparkleIcon className="h-10 w-10" />}
          title={t('milestones.empty.title')}
          description={t('milestones.empty.description')}
          action={
            <Link
              to="/milestones/new"
              className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-6 py-3 font-bold text-white shadow-md shadow-amber-500/20 transition-colors hover:bg-amber-600"
            >
              {t('milestones.empty.cta')}
            </Link>
          }
        />
      ) : baby ? (
        <MilestoneTimeline babyId={babyId} birthDate={baby.birthDate} items={items} />
      ) : null}
    </div>
  )
}
