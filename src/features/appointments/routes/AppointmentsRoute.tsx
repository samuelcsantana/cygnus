import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/shared/components/EmptyState'
import { CalendarIcon } from '@/shared/icons/calendar-icon'
import { PlusIcon } from '@/shared/icons/plus-icon'

import { useAllBabiesAppointments } from '../api/appointments.hooks'
import { AddAppointmentDialog } from '../components/AddAppointmentDialog'
import { AppointmentsList } from '../components/AppointmentsList'
import { AppointmentsSkeleton } from '../components/AppointmentsSkeleton'

export function AppointmentsRoute() {
  const { t } = useTranslation()
  const { isPending, isError, isEmpty, babies, items } = useAllBabiesAppointments()
  const [isAddOpen, setIsAddOpen] = useState(false)

  if (isEmpty) {
    return <Navigate to="/dashboard" replace />
  }

  const completedCount = items.filter((appointment) => appointment.status === 'COMPLETED').length
  const scheduledCount = items.filter((appointment) => appointment.status === 'SCHEDULED').length

  // Upcoming visits first (soonest first), then past ones (most recent first) —
  // reads as "what's next" followed by "history".
  const sortedItems = [...items].sort((a, b) => {
    const aScheduled = a.status === 'SCHEDULED'
    const bScheduled = b.status === 'SCHEDULED'
    if (aScheduled !== bScheduled) return aScheduled ? -1 : 1
    return aScheduled ? a.scheduledAt.localeCompare(b.scheduledAt) : b.scheduledAt.localeCompare(a.scheduledAt)
  })

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-ink">{t('appointments.title')}</h2>
          {/* Without the list, both counts are zeros derived from an empty
              array. Printed unconditionally they sat directly above "Não foi
              possível carregar as consultas." — the page asserted a count and
              then admitted, one line down, that it had read nothing. Same
              shape as the vaccine summary, same treatment. */}
          {isError ? (
            // Nothing here on error: the message below already says the list
            // did not load, and repeating it in a subtitle only competes with
            // it for attention.
            null
          ) : (
            <p className="mt-1 text-lg text-ink-muted">
              {isPending
                ? t('appointments.summaryUnavailable')
                : t('appointments.summary', { completed: completedCount, scheduled: scheduledCount })}
            </p>
          )}
        </div>
        <Button
          type="button"
          size="cta"
          onClick={() => setIsAddOpen(true)}
          className="rounded-2xl shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          {t('appointments.scheduleAction')}
        </Button>
      </div>

      <AddAppointmentDialog open={isAddOpen} onOpenChange={setIsAddOpen} />

      {isPending ? (
        <AppointmentsSkeleton />
      ) : isError ? (
        <p className="py-16 text-center text-ink-muted">{t('appointments.genericError')}</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="h-10 w-10" />}
          title={t('appointments.empty.title')}
          description={t('appointments.empty.description')}
          tone="violet"
          action={
            <Button
              type="button"
          size="cta"
              onClick={() => setIsAddOpen(true)}
              className="rounded-xl shadow-md shadow-emerald-900/20"
            >
              {t('appointments.empty.cta')}
            </Button>
          }
        />
      ) : (
        <AppointmentsList items={sortedItems} babies={babies} />
      )}
    </div>
  )
}
