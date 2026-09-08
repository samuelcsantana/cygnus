import { useSearchDestination } from '@/shared/stores/searchDestination.store'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
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
  const all = useAllBabiesAppointments()
  const selectedId = useSelectedBabyStore((state) => state.selectedBabyId)
  const client = useQueryClient()
  const babies = all.babies.filter((baby) => !selectedId || baby.id === selectedId)
  const entries = all.perBaby.filter((entry) => !selectedId || entry.baby.id === selectedId)
  const destination = useSearchDestination('/appointments')
  const items = entries
    .filter((entry) => !entry.isError)
    .flatMap((entry) => entry.items)
    .filter((item) => !destination || destination.keys.includes(`appointment:${item.id}`))
  const isEmpty = all.isEmpty
  const isPending = all.babies.length ? entries.some((entry) => entry.isPending) : all.isPending
  const isError = all.babies.length ? entries.some((entry) => entry.isError) : all.isError
  const [initialStatus, setInitialStatus] = useState<'SCHEDULED' | 'COMPLETED'>('SCHEDULED')
  const openEditor = (status: 'SCHEDULED' | 'COMPLETED') => {
    setInitialStatus(status)
    setIsAddOpen(true)
  }
  const retry = () => {
    if (!all.babies.length) void client.invalidateQueries({ queryKey: ['babies'] })
    entries
      .filter((entry) => entry.isError)
      .forEach(
        (entry) =>
          void client.invalidateQueries({ queryKey: ['babies', entry.baby.id, 'appointments'] }),
      )
  }
  const [isAddOpen, setIsAddOpen] = useState(false)

  if (isEmpty) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">
            {t('appointments.title')}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{t('appointments.page.intro')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => openEditor('COMPLETED')}
            className="min-h-11 rounded-xl px-3 text-sm font-semibold text-ink-muted hover:bg-muted"
          >
            {t('appointments.page.recordPast')}
          </button>
          <Button
            type="button"
            size="cta"
            onClick={() => openEditor('SCHEDULED')}
            className="rounded-2xl shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            {t('appointments.scheduleAction')}
          </Button>
        </div>
      </div>

      <AddAppointmentDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        initialStatus={initialStatus}
      />

      {isError && (
        <div role="alert" className="mb-5 rounded-2xl border border-border bg-card p-5">
          <p>
            {t('appointments.genericError')}{' '}
            {entries
              .filter((entry) => entry.isError)
              .map((entry) => entry.baby.name)
              .join(', ')}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-2 min-h-11 font-semibold text-primary"
          >
            {t('nav.shell.retry')}
          </button>
        </div>
      )}
      {isPending && <AppointmentsSkeleton />}
      {!isPending && !isError && items.length === 0 && (
        <EmptyState
          icon={<CalendarIcon className="h-10 w-10" />}
          title={t('appointments.empty.title')}
          description={t('appointments.empty.description')}
          tone="violet"
          action={
            <Button
              type="button"
              size="cta"
              onClick={() => openEditor('SCHEDULED')}
              className="rounded-xl shadow-md shadow-emerald-900/20"
            >
              {t('appointments.empty.cta')}
            </Button>
          }
        />
      )}
      {items.length > 0 && <AppointmentsList items={items} babies={babies} />}
    </div>
  )
}
