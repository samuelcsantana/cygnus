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
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300">
            <StethoscopeIcon className="h-[18px] w-[18px]" />
          </span>
          <h3 className="font-display text-base font-extrabold text-ink">{t('nav.appointments')}</h3>
        </div>
        <Link to="/appointments" className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
          {t('babies.dashboard.viewAll')}
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {isPending ? (
          <p className="py-6 text-center text-sm text-ink-muted">{t('common.loading')}</p>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-ink-muted">{t('appointments.genericError')}</p>
        ) : upcoming.length === 0 ? (
          /* A ausência de consulta agendada não é só ausência: desde 01/09 dá
             para registrar uma que já aconteceu, então o vazio tem dois
             caminhos e não nenhum. Antes esta linha relatava o nada e parava
             ali. */
          <div className="py-4 text-center">
            <p className="text-ink-muted text-[13px]">{t('babies.dashboard.noAppointmentsScheduled')}</p>
            <p className="text-ink-faint mt-1 text-xs">{t('babies.dashboard.appointmentsEmptyHint')}</p>
            <Link
              to="/appointments"
              className="text-primary mt-3 inline-block text-[13px] font-bold underline-offset-4 hover:underline"
            >
              {t('babies.dashboard.appointmentsEmptyCta')}
            </Link>
          </div>
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
                {/* O `font-semibold` que estava aqui saiu junto, e não foi
                    trocado por outro peso: a mono tem **um** peso carregado, e
                    declarar 500 ou 600 ou promete o que não existe (500 cai
                    para o 400 em silêncio) ou pede negrito sintetizado (600+),
                    que numa mono borra o desenho. Ver `--font-mono` em
                    `index.css`. A pílula não perde destaque — ele vem do fundo
                    tintado, não do peso. */}
                <span className="font-mono flex-shrink-0 rounded-full bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 text-[11px] text-violet-700 dark:text-violet-300">
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
