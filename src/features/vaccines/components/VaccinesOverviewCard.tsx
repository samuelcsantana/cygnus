import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { cn } from '@/lib/utils'
import { SyringeIcon } from '@/shared/icons/syringe-icon'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

import type { VaccineItemWithBaby } from '../api/vaccines.hooks'

const MAX_ITEMS = 5

interface VaccinesOverviewCardProps {
  babies: Baby[]
  items: VaccineItemWithBaby[]
  isPending: boolean
  isError: boolean
}

// Household-wide vaccines widget for the dashboard: one merged, urgency-sorted
// list across every child instead of repeating a full vaccines section per baby.
export function VaccinesOverviewCard({ babies, items, isPending, isError }: VaccinesOverviewCardProps) {
  const { t } = useTranslation()
  const babyById = new Map(babies.map((baby) => [baby.id, baby]))

  const routineItems = items.filter((item) => item.recommendationKind === 'ROUTINE')
  const appliedCount = routineItems.filter((item) => item.status === 'APPLIED').length
  const progressPct = routineItems.length > 0 ? Math.round((appliedCount / routineItems.length) * 100) : 0

  const urgentItems = [...items]
    .filter((item) => item.status !== 'APPLIED' && item.status !== 'GUIDANCE')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'DELAYED' ? -1 : 1
      return a.recommendedAgeInMonths - b.recommendedAgeInMonths
    })
    .slice(0, MAX_ITEMS)

  return (
    <div className="flex flex-col rounded-2xl bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <SyringeIcon className="h-[18px] w-[18px]" />
          </span>
          <h3 className="font-display text-base font-extrabold text-ink">{t('nav.vaccines')}</h3>
        </div>
        <Link to="/vaccines" className="text-xs font-bold text-teal-700">
          {t('babies.dashboard.viewAll')}
        </Link>
      </div>

      {!isPending && !isError && items.length > 0 && (
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-[13px]">
            <span className="font-semibold text-ink">{t('vaccines.progressLabel')}</span>
            <span className="text-primary font-bold">{progressPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2">
        {isPending ? (
          <p className="py-6 text-center text-sm text-ink-muted">{t('common.loading')}</p>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-ink-muted">{t('vaccines.genericError')}</p>
        ) : urgentItems.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-ink-muted">{t('babies.dashboard.vaccinesAllUpToDate')}</p>
        ) : (
          urgentItems.map((item) => {
            const baby = babyById.get(item.babyId)
            const avatarAppearance = baby ? babyAvatarAppearance(baby.id, baby.avatarColor) : null
            return (
              <div
                key={`${item.babyId}-${item.vaccineId}`}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2.5',
                  item.status === 'DELAYED' ? 'bg-rose-50' : 'bg-surface',
                )}
              >
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
                  <p className="truncate text-[13px] font-semibold text-ink">{item.name}</p>
                  <p className="truncate text-[11px] text-ink-muted">
                    {baby?.name} · {t('vaccines.doseLabel', { count: item.doseNumber })}
                  </p>
                </div>
                <span
                  className={cn(
                    'flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    item.status === 'DELAYED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800',
                  )}
                >
                  {item.status === 'DELAYED' ? t('vaccines.status.delayed') : t('vaccines.status.pending')}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
