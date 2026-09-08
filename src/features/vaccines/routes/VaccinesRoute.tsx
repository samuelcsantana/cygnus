import { useSearchDestination } from '@/shared/stores/searchDestination.store'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useQueryClient } from '@tanstack/react-query'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
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
import { VaccineProgressCard } from '../components/VaccineProgressCard'
import { vaccineProgress } from '../components/vaccine-progress'

type Filter = 'ALL' | VaccineStatus

export function VaccinesRoute() {
  const { t } = useTranslation()
  const calendar = useAllBabiesVaccineCalendars()
  const selectedId = useSelectedBabyStore((state) => state.selectedBabyId)
  const client = useQueryClient()
  const { isEmpty, metadata } = calendar
  const babies = calendar.babies.filter((baby) => !selectedId || baby.id === selectedId)
  const entries = calendar.perBaby.filter((entry) => !selectedId || entry.baby.id === selectedId)
  const destination = useSearchDestination('/vaccines')
  const items = entries
    .filter((entry) => !entry.isError)
    .flatMap((entry) => entry.items)
    .filter(
      (item) =>
        !destination ||
        destination.keys.includes(`vaccine:${item.babyId}:${item.vaccineId}`) ||
        destination.keys.includes(`vaccine:${item.babyId}:${item.vaccineId}:${item.doseNumber}`),
    )
  const isPending = !calendar.babies.length
    ? calendar.isPending
    : entries.some((entry) => entry.isPending)
  const isError = !calendar.babies.length
    ? calendar.isError
    : entries.some((entry) => entry.isError)
  const retry = () => {
    if (!calendar.babies.length) void client.invalidateQueries({ queryKey: ['babies'] })
    entries
      .filter((entry) => entry.isError)
      .forEach(
        (entry) =>
          void client.invalidateQueries({
            queryKey: ['babies', entry.baby.id, 'vaccines'],
          }),
      )
  }
  const [filter, setFilter] = useState<Filter>('ALL')
  const [isRegisterOpen, setRegisterOpen] = useState(false)

  if (isEmpty) {
    return <Navigate to="/dashboard" replace />
  }

  const counts = {
    APPLIED: items.filter((item) => item.status === 'APPLIED').length,
    PENDING: items.filter((item) => item.status === 'PENDING').length,
    DELAYED: items.filter((item) => item.status === 'DELAYED').length,
    GUIDANCE: items.filter((item) => item.status === 'GUIDANCE').length,
  }

  const filteredItems = (
    filter === 'ALL' ? items : items.filter((item) => item.status === filter)
  ).sort((a, b) => {
    const rank = { DELAYED: 0, GUIDANCE: 1, PENDING: 2, APPLIED: 3 } as const
    if (a.status !== b.status) return rank[a.status] - rank[b.status]
    return a.recommendedAgeInMonths - b.recommendedAgeInMonths
  })

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">{t('vaccines.title')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('vaccines.page.intro')}</p>
        </div>
        <Button
          type="button"
          size="cta"
          onClick={() => setRegisterOpen(true)}
          className="rounded-2xl shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          {t('vaccines.registerAction')}
        </Button>
      </div>

      <RegisterVaccineDialog open={isRegisterOpen} onOpenChange={setRegisterOpen} />

      {isError && (
        <div role="alert" className="mb-5 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-ink-muted">
            {t('vaccines.genericError')}{' '}
            {entries
              .filter((entry) => entry.isError)
              .map((entry) => entry.baby.name)
              .join(', ')}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-2 min-h-11 text-sm font-semibold text-primary"
          >
            {t('nav.shell.retry')}
          </button>
        </div>
      )}
      {destination?.source === 'notification' && !isPending && !isError && items.length === 0 && (
        <p role="status" className="rounded-2xl border border-border bg-card p-5 text-ink-muted">
          {t('notifications.recordUnavailable')}
        </p>
      )}
      {isPending && <VaccineCalendarSkeleton />}
      {!destination && !isPending && !isError && items.length === 0 && (
        <EmptyState
          icon={<SyringeIcon className="size-8" />}
          title={t('vaccines.empty.title')}
          description={t('vaccines.empty.description')}
          tone="emerald"
        />
      )}
      {items.length > 0 && (
        <>
          {!destination && !isPending && !isError && (
            <div className="mb-5">
              <VaccineProgressCard progress={vaccineProgress(items)} />
            </div>
          )}
          <div className="mb-6 flex flex-wrap gap-2">
            {babies.map((baby) => (
              <Link
                key={baby.id}
                to={`/vaccines/${baby.id}/card`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-card px-3.5 py-1.5 text-[13px] font-semibold text-ink-muted shadow-sm transition-colors hover:bg-muted hover:text-ink"
              >
                <PrinterIcon className="h-3.5 w-3.5" />
                {t('vaccines.card.viewAction', { name: baby.name })}
              </Link>
            ))}
          </div>

          {/* Same treatment as the milestone category row and the shared
              BabyFilterChips: the group carries a name, each chip carries its
              pressed state. Selection was previously fill colour only. */}
          <div
            className="mb-6 flex flex-wrap gap-2"
            role="group"
            aria-label={t('vaccines.statusFilter.groupLabel')}
          >
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
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={cn(
                  'min-h-11 rounded-xl px-4 py-1.5 text-[13px] font-semibold transition-colors',
                  filter === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-ink-muted shadow-sm hover:bg-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <VaccineCalendarList items={filteredItems} babies={babies} filterKey={filter} />
        </>
      )}

      {(!destination || destination.keys.some((key) => key.startsWith('adhoc:'))) && (
        <AdhocVaccineList babies={babies} />
      )}
      {metadata && (
        <details className="mt-6 rounded-2xl border border-border bg-card p-4">
          <summary className="cursor-pointer py-2 text-sm font-semibold text-ink">
            {t('vaccines.catalog.title')}
          </summary>
          <VaccineCatalogNotice metadata={metadata} className="mt-3" />
        </details>
      )}
    </div>
  )
}
