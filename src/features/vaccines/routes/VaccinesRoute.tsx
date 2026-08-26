import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'

import { FamilyStrip } from '@/features/babies/components/FamilyStrip'
import { EditBabyDialog } from '@/features/babies/components/EditBabyDialog'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/shared/components/EmptyState'
import { PlusIcon } from '@/shared/icons/plus-icon'
import { PrinterIcon } from '@/shared/icons/printer-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'

import { useAllBabiesVaccineCalendars } from '../api/vaccines.hooks'
import type { VaccineStatus } from '../api/vaccines.schemas'
import { AdhocVaccineList } from '../components/AdhocVaccineList'
import { RegisterVaccineDialog } from '../components/RegisterVaccineDialog'
import { VaccineCalendarList } from '../components/VaccineCalendarList'
import { VaccineCalendarSkeleton } from '../components/VaccineCalendarSkeleton'
import { VaccineCatalogNotice } from '../components/VaccineCatalogNotice'

type Filter = 'ALL' | VaccineStatus

export function VaccinesRoute() {
  const { t } = useTranslation()
  const { isPending, isError, isEmpty, babies, items, metadata } = useAllBabiesVaccineCalendars()
  const [filter, setFilter] = useState<Filter>('ALL')
  const [isRegisterOpen, setRegisterOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Baby | null>(null)

  if (isEmpty) {
    return <Navigate to="/dashboard" replace />
  }

  const counts = {
    APPLIED: items.filter((item) => item.status === 'APPLIED').length,
    PENDING: items.filter((item) => item.status === 'PENDING').length,
    DELAYED: items.filter((item) => item.status === 'DELAYED').length,
    GUIDANCE: items.filter((item) => item.status === 'GUIDANCE').length,
  }

  const familyStripItems = babies.map((baby) => ({
    baby,
    delayedVaccineCount: items.filter((item) => item.babyId === baby.id && item.status === 'DELAYED').length,
  }))

  const filteredItems = (filter === 'ALL' ? items : items.filter((item) => item.status === filter)).sort((a, b) => {
    const rank = { DELAYED: 0, GUIDANCE: 1, PENDING: 2, APPLIED: 3 } as const
    if (a.status !== b.status) return rank[a.status] - rank[b.status]
    return a.recommendedAgeInMonths - b.recommendedAgeInMonths
  })

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-ink">{t('vaccines.title')}</h2>
          <p className="mt-1 text-lg text-ink-muted">
            {t('vaccines.summary', { applied: counts.APPLIED, delayed: counts.DELAYED, pending: counts.PENDING })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRegisterOpen(true)}
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-emerald-900/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          {t('vaccines.registerAction')}
        </button>
      </div>

      <RegisterVaccineDialog open={isRegisterOpen} onOpenChange={setRegisterOpen} />

      {metadata && <VaccineCatalogNotice metadata={metadata} className="mb-6" />}

      {isPending ? (
        <VaccineCalendarSkeleton />
      ) : isError ? (
        <p className="py-16 text-center text-ink-muted">{t('vaccines.genericError')}</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<SyringeIcon className="h-10 w-10" />}
          title={t('vaccines.empty.title')}
          description={t('vaccines.empty.description')}
          tone="emerald"
        />
      ) : (
        <>
          {babies.length > 1 && (
            <div className="mb-6">
              <FamilyStrip items={familyStripItems} onEdit={setEditTarget} />
            </div>
          )}

          <div className="mb-6 flex flex-wrap gap-2">
            {babies.map((baby) => (
              <Link
                key={baby.id}
                to={`/vaccines/${baby.id}/card`}
                className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-1.5 text-[13px] font-semibold text-ink-muted shadow-sm transition-colors hover:bg-muted hover:text-ink"
              >
                <PrinterIcon className="h-3.5 w-3.5" />
                {t('vaccines.card.viewAction', { name: baby.name })}
              </Link>
            ))}
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {(
              [
                ['ALL', t('vaccines.filterAll')],
                ['APPLIED', t('vaccines.filterApplied', { count: counts.APPLIED })],
                ['PENDING', t('vaccines.filterPending', { count: counts.PENDING })],
                ['DELAYED', t('vaccines.filterDelayed', { count: counts.DELAYED })],
                ['GUIDANCE', t('vaccines.filterGuidance', { count: counts.GUIDANCE })],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors',
                  filter === value ? 'bg-primary text-primary-foreground' : 'bg-card text-ink-muted shadow-sm hover:bg-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <VaccineCalendarList items={filteredItems} babies={babies} />
          <AdhocVaccineList babies={babies} />
        </>
      )}

      <EditBabyDialog baby={editTarget} onOpenChange={(open) => !open && setEditTarget(null)} />
    </div>
  )
}
