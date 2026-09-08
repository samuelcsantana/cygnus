import { useState } from 'react'
import { appointmentGroup, sortAppointments, type AppointmentView } from './appointment-view'
import { useTranslation } from 'react-i18next'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePagedList } from '@/hooks/usePagedList'
import { LoadMoreButton } from '@/shared/components/LoadMoreButton'
import { NoSearchResults } from '@/shared/components/NoSearchResults'
import { SearchInput } from '@/shared/components/SearchInput'

import type { Appointment } from '../api/appointments.schemas'
import { AppointmentCard } from './AppointmentCard'
import { AppointmentDetailDialog } from './AppointmentDetailDialog'
import { RescheduleDialog } from './RescheduleDialog'

interface AppointmentsListProps {
  items: Appointment[]
  babies: Baby[]
}

// Renders a single, merged, household-wide grid — each card tagged with which
// baby it belongs to, so a family with several children sees one chronological
// list instead of one full section repeated per child.
export function AppointmentsList({ items, babies }: AppointmentsListProps) {
  const { t } = useTranslation()
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null)
  const [detailTarget, setDetailTarget] = useState<Appointment | null>(null)
  // The child filter is the menu's, not this page's: the choice outlives the page
  // it was made on. See selectedBaby.store.ts.
  const [filter, setFilter] = useState<AppointmentView>('ALL')
  const now = Date.now()
  const groups = ['ALL', 'UPCOMING', 'REVIEW', 'COMPLETED', 'CANCELLED'] as const
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const babyById = new Map(babies.map((baby) => [baby.id, baby]))

  const babyFiltered = sortAppointments(
    items.filter((item) => filter === 'ALL' || appointmentGroup(item, now) === filter),
    now,
  )
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
  const normalizedSearch = normalize(debouncedSearch)
  const filteredItems = normalizedSearch
    ? babyFiltered.filter((item) =>
        [item.doctorName, item.specialty, item.location, item.reason]
          .filter((value): value is string => !!value)
          .some((value) => normalize(value).includes(normalizedSearch)),
      )
    : babyFiltered

  const { visibleItems, hasMore, loadMore } = usePagedList(
    filteredItems,
    `${normalizedSearch}|${filter}|${babies.map((baby) => baby.id).join()}`,
  )

  return (
    <div>
      <div
        role="group"
        aria-label={t('appointments.page.filters')}
        className="mb-4 flex flex-wrap gap-2"
      >
        {groups.map((group) => (
          <button
            key={group}
            type="button"
            aria-pressed={filter === group}
            onClick={() => setFilter(group)}
            className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold ${filter === group ? 'bg-violet-700 text-white' : 'bg-card text-ink-muted hover:bg-muted'}`}
          >
            {t(`appointments.page.${group}`)} (
            {group === 'ALL'
              ? items.length
              : items.filter((item) => appointmentGroup(item, now) === group).length}
            )
          </button>
        ))}
      </div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          id="appointment-search"
          label={t('appointments.search.label')}
          value={search}
          onChange={setSearch}
          placeholder={t('appointments.page.search')}
          clearLabel={t('vaccines.searchUi.clear')}
          inputClassName="h-12 rounded-xl"
          className="w-full sm:max-w-lg"
        />
      </div>

      {filteredItems.length === 0 ? (
        normalizedSearch ? (
          <NoSearchResults />
        ) : (
          <p role="status" className="rounded-2xl bg-card p-8 text-center text-sm text-ink-muted">
            {t('appointments.page.noFilter')}
          </p>
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {visibleItems.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                baby={babies.length > 1 ? babyById.get(appointment.babyId) : undefined}
                featured={
                  !normalizedSearch &&
                  (filter === 'ALL' || filter === 'UPCOMING') &&
                  appointment.id ===
                    babyFiltered.find((item) => appointmentGroup(item, now) === 'UPCOMING')?.id
                }
                onReschedule={() => setRescheduleTarget(appointment)}
                onViewDetails={() => setDetailTarget(appointment)}
              />
            ))}
          </div>
          {hasMore && <LoadMoreButton onClick={loadMore} label={t('common.loadMore')} />}
        </>
      )}

      <RescheduleDialog
        appointment={rescheduleTarget}
        onOpenChange={(open) => !open && setRescheduleTarget(null)}
      />
      <AppointmentDetailDialog
        baby={babyById.get(detailTarget?.babyId ?? '')}
        appointment={detailTarget}
        onOpenChange={(open) => !open && setDetailTarget(null)}
      />
    </div>
  )
}
