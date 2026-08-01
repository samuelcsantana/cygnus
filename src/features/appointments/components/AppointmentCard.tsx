import { useTranslation } from 'react-i18next'

import { formatDateDisplay, splitScheduledAt } from '@/lib/date'
import { ClockIcon } from '@/shared/icons/clock-icon'

import type { Appointment } from '../api/appointments.schemas'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'

interface AppointmentCardProps {
  appointment: Appointment
  onReschedule: () => void
  onViewDetails: () => void
}

export function AppointmentCard({ appointment, onReschedule, onViewDetails }: AppointmentCardProps) {
  const { t, i18n } = useTranslation()
  const { date, time } = splitScheduledAt(appointment.scheduledAt)
  const isScheduled = appointment.status === 'SCHEDULED'

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
      <div className="absolute top-0 left-0 h-full w-2 bg-indigo-500" />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="mb-1 text-xl font-bold text-slate-900">{appointment.doctorName}</h3>
          <AppointmentStatusBadge status={appointment.status} />
        </div>
        <div className="min-w-[80px] rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center">
          <span className="mb-1 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {t('appointments.dateLabel')}
          </span>
          <span className="block text-lg font-black text-slate-800">{formatDateDisplay(date, i18n.language)}</span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-600">
        <span className="flex items-center rounded-lg bg-slate-50 px-4 py-2">
          <ClockIcon className="mr-2 h-4 w-4 text-indigo-500" />
          {time}
        </span>
        {appointment.location && <span className="text-slate-500">{appointment.location}</span>}
      </div>

      {appointment.reason && <p className="mb-4 text-sm text-slate-600">{appointment.reason}</p>}

      {appointment.notes && (
        <div className="mb-6 rounded-xl border border-slate-100 bg-[#F8FAFC] p-4 text-sm font-medium text-slate-600">
          &ldquo;{appointment.notes}&rdquo;
        </div>
      )}

      {isScheduled ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onReschedule}
            className="flex-1 rounded-xl border-2 border-slate-100 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-slate-200 hover:bg-slate-50"
          >
            {t('appointments.reschedule.action')}
          </button>
          <button
            type="button"
            onClick={onViewDetails}
            className="flex-1 rounded-xl bg-indigo-50 py-3 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
          >
            {t('appointments.detail.action')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onViewDetails}
          className="w-full rounded-xl bg-indigo-50 py-3 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
        >
          {t('appointments.detail.action')}
        </button>
      )}
    </div>
  )
}
