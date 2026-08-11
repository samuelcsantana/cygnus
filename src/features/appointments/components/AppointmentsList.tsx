import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePagedList } from '@/hooks/usePagedList'
import { BabyFilterChips } from '@/shared/components/BabyFilterChips'
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
  const [babyFilter, setBabyFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const babyById = new Map(babies.map((baby) => [baby.id, baby]))

  const babyFiltered = babyFilter ? items.filter((item) => item.babyId === babyFilter) : items
  const normalizedSearch = debouncedSearch.trim().toLowerCase()
  const filteredItems = normalizedSearch
    ? babyFiltered.filter((item) =>
        [item.doctorName, item.specialty, item.location, item.reason]
          .filter((value): value is string => !!value)
          .some((value) => value.toLowerCase().includes(normalizedSearch)),
      )
    : babyFiltered

  const { visibleItems, hasMore, loadMore } = usePagedList(filteredItems, `${normalizedSearch}|${babyFilter}`)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BabyFilterChips babies={babies} value={babyFilter} onChange={setBabyFilter} />
        <SearchInput
          id="appointment-search"
          label={t('appointments.search.label')}
          value={search}
          onChange={setSearch}
          placeholder={t('common.search.placeholder')}
          className="sm:w-64"
        />
      </div>

      {filteredItems.length === 0 ? (
        <NoSearchResults />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {visibleItems.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                baby={babyById.get(appointment.babyId)}
                onReschedule={() => setRescheduleTarget(appointment)}
                onViewDetails={() => setDetailTarget(appointment)}
              />
            ))}
          </div>
          {hasMore && <LoadMoreButton onClick={loadMore} label={t('common.loadMore')} />}
        </>
      )}

      <RescheduleDialog appointment={rescheduleTarget} onOpenChange={(open) => !open && setRescheduleTarget(null)} />
      <AppointmentDetailDialog appointment={detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)} />
    </div>
  )
}
