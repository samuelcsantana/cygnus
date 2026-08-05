import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

import { useBabies } from '@/features/babies/api/babies.hooks'
import { useEffectiveBabyId } from '@/hooks/useEffectiveBabyId'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/shared/components/EmptyState'
import { PlusIcon } from '@/shared/icons/plus-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'

import { useVaccineCalendar } from '../api/vaccines.hooks'
import type { VaccineStatus } from '../api/vaccines.schemas'
import { AdhocVaccineList } from '../components/AdhocVaccineList'
import { RegisterVaccineDialog } from '../components/RegisterVaccineDialog'
import { VaccineCalendarList } from '../components/VaccineCalendarList'
import { VaccineCalendarSkeleton } from '../components/VaccineCalendarSkeleton'

type Filter = 'ALL' | VaccineStatus

export function VaccinesRoute() {
  const { t } = useTranslation()
  const babyId = useEffectiveBabyId()
  const babies = useBabies()
  const calendar = useVaccineCalendar(babyId)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [isRegisterOpen, setRegisterOpen] = useState(false)

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

  const filteredItems = filter === 'ALL' ? allItems : allItems.filter((item) => item.status === filter)

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-ink">
            {baby ? t('vaccines.titleWithBaby', { name: baby.name }) : t('vaccines.title')}
          </h2>
          <p className="mt-1 text-lg text-ink-muted">
            {t('vaccines.summary', { applied: counts.APPLIED, delayed: counts.DELAYED, pending: counts.PENDING })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRegisterOpen(true)}
          className="inline-flex items-center justify-center rounded-2xl bg-teal-600 px-6 py-3 font-bold text-white shadow-lg shadow-teal-900/20 transition-all hover:bg-teal-700 active:scale-[0.98]"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          {t('vaccines.registerAction')}
        </button>
      </div>

      <RegisterVaccineDialog
        babyId={babyId}
        pendingItems={allItems.filter((item) => item.status !== 'APPLIED')}
        open={isRegisterOpen}
        onOpenChange={setRegisterOpen}
      />

      {calendar.isPending ? (
        <VaccineCalendarSkeleton />
      ) : calendar.isError ? (
        <p className="py-16 text-center text-ink-muted">{t('vaccines.genericError')}</p>
      ) : !hasAnyDose ? (
        <EmptyState
          icon={<SyringeIcon className="h-10 w-10" />}
          title={t('vaccines.empty.title')}
          description={t('vaccines.empty.description')}
          tone="teal"
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

          <VaccineCalendarList items={filteredItems} babyId={babyId} />
        </>
      )}

      <AdhocVaccineList babyId={babyId} />
    </div>
  )
}
