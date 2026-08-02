import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'

import { useBabies } from '@/features/babies/api/babies.hooks'
import { useEffectiveBabyId } from '@/hooks/useEffectiveBabyId'
import { EmptyState } from '@/shared/components/EmptyState'
import { CalendarIcon } from '@/shared/icons/calendar-icon'
import { PlusIcon } from '@/shared/icons/plus-icon'

import { useAppointments } from '../api/appointments.hooks'
import type { Appointment } from '../api/appointments.schemas'
import { AppointmentCard } from '../components/AppointmentCard'
import { AppointmentDetailDialog } from '../components/AppointmentDetailDialog'
import { AppointmentsSkeleton } from '../components/AppointmentsSkeleton'
import { RescheduleDialog } from '../components/RescheduleDialog'

export function AppointmentsRoute() {
  const { t } = useTranslation()
  const babyId = useEffectiveBabyId()
  const babies = useBabies()
  const appointments = useAppointments(babyId)
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null)
  const [detailTarget, setDetailTarget] = useState<Appointment | null>(null)

  if (!babyId) {
    return <Navigate to="/dashboard" replace />
  }

  const baby = babies.data?.find((candidate) => candidate.id === babyId)
  const items = appointments.data ?? []

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-semibold tracking-wider text-violet-600 uppercase">
            {t('appointments.eyebrow')}
          </p>
          <h2 className="font-display text-3xl font-extrabold text-ink">{t('appointments.title')}</h2>
          {baby && <p className="mt-1 text-lg text-ink-muted">{baby.name}</p>}
        </div>
        <Link
          to="/appointments/new"
          className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-6 py-3 font-bold text-white shadow-lg shadow-violet-600/30 transition-all hover:bg-violet-700 active:scale-[0.98]"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          {t('appointments.scheduleAction')}
        </Link>
      </div>

      {appointments.isPending ? (
        <AppointmentsSkeleton />
      ) : appointments.isError ? (
        <p className="py-16 text-center text-ink-muted">{t('appointments.genericError')}</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="h-10 w-10" />}
          title={t('appointments.empty.title')}
          description={t('appointments.empty.description')}
          action={
            <Link
              to="/appointments/new"
              className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-6 py-3 font-bold text-white shadow-md shadow-violet-600/20 transition-colors hover:bg-violet-700"
            >
              {t('appointments.empty.cta')}
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {items.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onReschedule={() => setRescheduleTarget(appointment)}
              onViewDetails={() => setDetailTarget(appointment)}
            />
          ))}
        </div>
      )}

      <RescheduleDialog
        babyId={babyId}
        appointment={rescheduleTarget}
        onOpenChange={(open) => !open && setRescheduleTarget(null)}
      />
      <AppointmentDetailDialog
        babyId={babyId}
        appointment={detailTarget}
        onOpenChange={(open) => !open && setDetailTarget(null)}
      />
    </div>
  )
}
