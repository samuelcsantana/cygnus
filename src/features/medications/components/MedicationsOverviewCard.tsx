import { useLocalToday } from '@/hooks/useLocalToday'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { formatDateDisplay } from '@/lib/date'
import { HeartIcon } from '@/shared/icons/heart-icon'

import { medicationStatus, sortMedications, type Medication } from '../api/medications.schemas'

const MAX_ITEMS = 4

interface MedicationsOverviewCardProps {
  babies: Baby[]
  items: Medication[]
  isPending: boolean
  isError: boolean
}

export function MedicationsOverviewCard({
  babies,
  items,
  isPending,
  isError,
}: MedicationsOverviewCardProps) {
  const { t, i18n } = useTranslation()
  const babyById = new Map(babies.map((baby) => [baby.id, baby]))

  const today = useLocalToday()
  const latest = sortMedications(items, today).slice(0, MAX_ITEMS)

  return (
    <div className="flex flex-col rounded-2xl border border-border/60 bg-overview-sky p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
            <HeartIcon className="h-[18px] w-[18px]" />
          </span>
          <h3 className="font-display text-lg font-medium text-ink">
            {t('medications.title')}
          </h3>
        </div>
        <Link
          to="/medications"
          className="text-xs font-semibold text-emerald-700 dark:text-emerald-300"
        >
          {t('babies.dashboard.viewAll')}
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {isPending ? (
          <p className="py-6 text-center text-sm text-ink-muted">{t('common.loading')}</p>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-ink-muted">{t('medications.genericError')}</p>
        ) : latest.length === 0 ? (
          <div className="py-4 text-center">
            <p className="mb-3 text-[13px] text-ink-muted">{t('medications.dashboard.empty')}</p>
            <Link
              to="/medications"
              className="text-primary text-[13px] font-bold underline-offset-4 hover:underline"
            >
              {t('medications.dashboard.emptyCta')}
            </Link>
          </div>
        ) : (
          latest.map((medication) => {
            const baby = babyById.get(medication.babyId)
            return (
              <div key={medication.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 truncate text-[13px] font-bold text-ink">
                    {medication.name}
                  </p>
                  <div className="flex items-center gap-2">
                    {baby && (
                      <span className="truncate text-[11px] font-semibold text-ink-muted">
                        {baby.name}
                      </span>
                    )}
                    {baby && <span className="text-[11px] text-ink-faint">·</span>}
                    <span className="font-mono text-[11px] text-ink-muted">
                      {formatDateDisplay(medication.startedOn, i18n.language)}
                    </span>
                  </div>
                </div>
                {
                  <span className="flex-shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    {t(`medications.period.${medicationStatus(medication, today)}`)}
                  </span>
                }
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
