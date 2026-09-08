import { useTranslation } from 'react-i18next'
import { MapPin, ClipboardList } from 'lucide-react'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { formatDateDisplay, splitScheduledAt } from '@/lib/date'
import { formatCentimeters, formatKilograms } from '@/shared/utils/measurements'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { appointmentGroup } from './appointment-view'
import type { Appointment } from '../api/appointments.schemas'
interface Props {
  appointment: Appointment
  baby?: Baby
  featured?: boolean
  onReschedule: () => void
  onViewDetails: () => void
}
export function AppointmentCard({
  appointment,
  baby,
  featured = false,
  onReschedule,
  onViewDetails,
}: Props) {
  const { t, i18n } = useTranslation()
  const { date, time } = splitScheduledAt(appointment.scheduledAt)
  const group = appointmentGroup(appointment, Date.now())
  return (
    <article
      className={`flex min-w-0 flex-col rounded-2xl border p-5 ${featured ? 'border-violet-300 bg-violet-50/60 dark:border-violet-800 dark:bg-violet-950/30 lg:col-span-2' : 'border-border bg-card'}`}
    >
      {featured && (
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-violet-800 dark:text-violet-200">
          {t('appointments.page.next')}
        </p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-2 font-mono text-sm text-violet-800 dark:text-violet-200">
            {formatDateDisplay(date, i18n.language)} · {time}
          </p>
          <h3 className="break-words text-lg font-bold text-ink">{appointment.doctorName}</h3>
          <p className="mt-1 break-words text-sm text-ink-muted">
            {[baby?.name, appointment.specialty].filter(Boolean).join(' · ')}
          </p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>
      {group === 'REVIEW' && (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {t('appointments.page.reviewHint')}
        </p>
      )}
      <dl className="mt-4 space-y-2 text-sm text-ink-muted">
        {appointment.location && (
          <div className="flex items-start gap-2">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
            <dt className="sr-only">{t('appointments.page.location')}</dt>
            <dd className="break-words">{appointment.location}</dd>
          </div>
        )}
        {appointment.reason && (
          <div className="flex items-start gap-2">
            <ClipboardList aria-hidden className="mt-0.5 size-4 shrink-0" />
            <dt className="sr-only">{t('appointments.page.reason')}</dt>
            <dd className="break-words">{appointment.reason}</dd>
          </div>
        )}
      </dl>
      {appointment.status === 'COMPLETED' &&
        (appointment.weightGrams !== null || appointment.heightMillimeters !== null) && (
          <p className="mt-3 font-mono text-sm text-ink-muted">
            {[
              appointment.weightGrams !== null
                ? formatKilograms(appointment.weightGrams, i18n.language)
                : null,
              appointment.heightMillimeters !== null
                ? formatCentimeters(appointment.heightMillimeters, i18n.language)
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      {appointment.notes && (
        <p className="mt-3 line-clamp-2 whitespace-pre-wrap break-words rounded-xl bg-muted/50 p-3 text-sm text-ink-muted">
          {appointment.notes}
        </p>
      )}
      <div className="mt-auto flex flex-wrap justify-end gap-2 pt-5">
        {appointment.status === 'SCHEDULED' && (
          <button
            type="button"
            onClick={onReschedule}
            className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink-muted hover:bg-muted"
          >
            {t('appointments.reschedule.action')}
          </button>
        )}
        <button
          type="button"
          onClick={onViewDetails}
          className="min-h-11 rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800"
        >
          {t('appointments.detail.action')}
        </button>
      </div>
    </article>
  )
}
