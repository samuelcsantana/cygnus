import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

import { useBabies } from '@/features/babies/api/babies.hooks'
import { useEffectiveBabyId } from '@/hooks/useEffectiveBabyId'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/shared/components/EmptyState'
import { SyringeIcon } from '@/shared/icons/syringe-icon'

import { useVaccineCalendar } from '../api/vaccines.hooks'
import type { VaccineStatus } from '../api/vaccines.schemas'
import { VaccineCalendarList } from '../components/VaccineCalendarList'
import { VaccineCalendarSkeleton } from '../components/VaccineCalendarSkeleton'

type Filter = 'ALL' | VaccineStatus

export function VaccinesRoute() {
  const { t } = useTranslation()
  const babyId = useEffectiveBabyId()
  const babies = useBabies()
  const calendar = useVaccineCalendar(babyId)
  const [filter, setFilter] = useState<Filter>('ALL')

  if (!babyId) {
    return <Navigate to="/dashboard" replace />
  }

  const baby = babies.data?.find((candidate) => candidate.id === babyId)
  const groups = calendar.data ?? []
  const allItems = groups.flatMap((group) => group.items)
  const hasAnyDose = allItems.length > 0

  const counts = {
    APPLIED: allItems.filter((item) => item.status === 'APPLIED').length,
    PENDING: allItems.filter((item) => item.status === 'PENDING').length,
    DELAYED: allItems.filter((item) => item.status === 'DELAYED').length,
  }
  const progressPct = allItems.length > 0 ? Math.round((counts.APPLIED / allItems.length) * 100) : 0

  const filteredGroups = groups
    .map((group) => ({
      ...group,
      items: filter === 'ALL' ? group.items : group.items.filter((item) => item.status === filter),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-primary mb-1 text-sm font-semibold tracking-wider uppercase">{t('vaccines.eyebrow')}</p>
          <h2 className="font-display text-3xl font-extrabold text-ink">{t('vaccines.title')}</h2>
          {baby && <p className="mt-1 text-lg text-ink-muted">{baby.name}</p>}
        </div>
      </div>

      {calendar.isPending ? (
        <VaccineCalendarSkeleton />
      ) : calendar.isError ? (
        <p className="py-16 text-center text-ink-muted">{t('vaccines.genericError')}</p>
      ) : !hasAnyDose ? (
        <EmptyState
          icon={<SyringeIcon className="h-10 w-10" />}
          title={t('vaccines.empty.title')}
          description={t('vaccines.empty.description')}
        />
      ) : (
        <>
          <div className="mb-5 rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-ink">{t('vaccines.progressLabel')}</span>
              <span className="text-primary text-[13px] font-bold">{progressPct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {(
              [
                ['ALL', t('vaccines.filterAll')],
                ['APPLIED', t('vaccines.filterApplied', { count: counts.APPLIED })],
                ['PENDING', t('vaccines.filterPending', { count: counts.PENDING })],
                ['DELAYED', t('vaccines.filterDelayed', { count: counts.DELAYED })],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors',
                  filter === value ? 'bg-primary text-white' : 'bg-white text-ink-muted shadow-sm hover:bg-slate-50',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <VaccineCalendarList groups={filteredGroups} babyId={babyId} />
        </>
      )}
    </div>
  )
}
