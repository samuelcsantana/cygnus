import { useTranslation } from 'react-i18next'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { formatDateDisplay, splitScheduledAt } from '@/lib/date'
import { cn } from '@/lib/utils'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

import type { Appointment } from '../api/appointments.schemas'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'

interface AppointmentCardProps {
  appointment: Appointment
  baby?: Baby
  onReschedule: () => void
  onViewDetails: () => void
}

export function AppointmentCard({ appointment, baby, onReschedule, onViewDetails }: AppointmentCardProps) {
  const { t, i18n } = useTranslation()
  const { date, time } = splitScheduledAt(appointment.scheduledAt)
  const isScheduled = appointment.status === 'SCHEDULED'
  const avatarAppearance = baby ? babyAvatarAppearance(baby.id, baby.avatarColor) : null

  return (
    <div
      className={cn(
        'rounded-2xl bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6',
        isScheduled ? 'border-[1.5px] border-violet-200' : 'border-[1.5px] border-transparent',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          {baby ? (
            <span
              className={cn(
                'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-base font-black',
                avatarAppearance?.className,
              )}
              style={avatarAppearance?.style}
              title={baby.name}
            >
              {babyInitials(baby.name)}
            </span>
          ) : (
            <span
              className={cn(
                'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl',
                isScheduled ? 'bg-violet-50 text-violet-500' : 'bg-teal-50 text-teal-700',
              )}
            >
              <StethoscopeIcon className="h-5 w-5" />
            </span>
          )}
          <div>
            <h3 className="text-[15px] font-bold text-ink">{appointment.doctorName}</h3>
            <p className="text-[13px] text-ink-muted">
              {baby?.name}
              {baby && appointment.specialty && ' · '}
              {appointment.specialty}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <AppointmentStatusBadge status={appointment.status} />
          <p className="mt-1 text-xs text-ink-faint">
            {formatDateDisplay(date, i18n.language)} · {time}
          </p>
        </div>
      </div>

      {appointment.reason && <p className="mb-1 text-[13px] text-ink-muted">{appointment.reason}</p>}
      {appointment.location && <p className="mb-1 text-[13px] text-ink-muted">{appointment.location}</p>}

      {appointment.notes && (
        <div className="mt-3 rounded-[10px] bg-surface px-3.5 py-2.5">
          <p className="text-[13px] leading-relaxed text-ink-muted">📋 {appointment.notes}</p>
        </div>
      )}

      {isScheduled ? (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onReschedule}
            className="flex-1 rounded-xl border-2 border-border py-2.5 text-sm font-bold text-ink-muted transition-colors hover:border-border hover:bg-muted"
          >
            {t('appointments.reschedule.action')}
          </button>
          <button
            type="button"
            onClick={onViewDetails}
            className="flex-1 rounded-xl bg-violet-50 py-2.5 text-sm font-bold text-violet-700 transition-colors hover:bg-violet-100"
          >
            {t('appointments.detail.action')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onViewDetails}
          className="mt-4 w-full rounded-xl bg-teal-50 py-2.5 text-sm font-bold text-teal-700 transition-colors hover:bg-teal-100"
        >
          {t('appointments.detail.action')}
        </button>
      )}
    </div>
  )
}
