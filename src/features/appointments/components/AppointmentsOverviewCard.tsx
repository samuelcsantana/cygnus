import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { formatDateDisplay, splitScheduledAt } from '@/lib/date'
import { cn } from '@/lib/utils'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

import type { Appointment } from '../api/appointments.schemas'

const MAX_ITEMS = 4

interface AppointmentsOverviewCardProps {
  babies: Baby[]
  items: Appointment[]
  isPending: boolean
  isError: boolean
}

// Household-wide appointments widget for the dashboard: the next scheduled
// visits across every child, merged into a single chronological list.
export function AppointmentsOverviewCard({ babies, items, isPending, isError }: AppointmentsOverviewCardProps) {
  const { t, i18n } = useTranslation()
  const babyById = new Map(babies.map((baby) => [baby.id, baby]))

  const upcoming = items
    .filter((appointment) => appointment.status === 'SCHEDULED')
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    .slice(0, MAX_ITEMS)

  return (
    <div className="flex flex-col rounded-2xl bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <StethoscopeIcon className="h-[18px] w-[18px]" />
          </span>
          <h3 className="font-display text-base font-extrabold text-ink">{t('nav.appointments')}</h3>
        </div>
        <Link to="/appointments" className="text-xs font-bold text-teal-700">
          {t('babies.dashboard.viewAll')}
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {isPending ? (
          <p className="py-6 text-center text-sm text-ink-muted">{t('common.loading')}</p>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-ink-muted">{t('appointments.genericError')}</p>
        ) : upcoming.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-ink-muted">{t('babies.dashboard.noAppointmentsScheduled')}</p>
        ) : (
          upcoming.map((appointment) => {
            const baby = babyById.get(appointment.babyId)
            const avatarAppearance = baby ? babyAvatarAppearance(baby.id, baby.avatarColor) : null
            const { date } = splitScheduledAt(appointment.scheduledAt)
            return (
              <div key={appointment.id} className="flex items-center gap-2.5 rounded-lg bg-surface px-3 py-2.5">
                {baby && (
                  <span
                    title={baby.name}
                    className={cn(
                      'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black',
                      avatarAppearance?.className,
                    )}
                    style={avatarAppearance?.style}
                  >
                    {babyInitials(baby.name)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{appointment.doctorName}</p>
                  <p className="truncate text-[11px] text-ink-muted">{baby?.name}</p>
                </div>
                <span className="flex-shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                  {formatDateDisplay(date, i18n.language)}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
