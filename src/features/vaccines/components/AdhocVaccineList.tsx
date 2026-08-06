import { useTranslation } from 'react-i18next'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { cn } from '@/lib/utils'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

import { useAllBabiesAdhocVaccines } from '../api/vaccines.hooks'

interface AdhocVaccineListProps {
  babies: Baby[]
}

// Household-wide list of campaign/custom vaccine records, each tagged with
// which child it belongs to.
export function AdhocVaccineList({ babies }: AdhocVaccineListProps) {
  const { t } = useTranslation()
  const { items } = useAllBabiesAdhocVaccines()
  const babyById = new Map(babies.map((baby) => [baby.id, baby]))

  if (items.length === 0) {
    return null
  }

  return (
    <div className="mt-5 rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
      <div className="mb-4">
        <h3 className="font-display text-base font-extrabold text-ink">{t('vaccines.adhoc.sectionTitle')}</h3>
        <p className="mt-0.5 text-sm text-ink-muted">{t('vaccines.adhoc.sectionDescription')}</p>
      </div>

      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const baby = babyById.get(item.babyId)
          const avatarAppearance = baby ? babyAvatarAppearance(baby.id, baby.avatarColor) : null
          return (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-transparent bg-white p-4 shadow-[0_1px_6px_rgba(0,0,0,0.03)]"
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
                <p className="text-sm font-bold text-ink">{item.customName}</p>
                <p className="text-xs text-ink-muted">
                  {baby?.name} · {item.customDose ? `${item.customDose} · ` : ''}
                  {item.applicationDate}
                </p>
              </div>
              <span
                className={cn(
                  'flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                  item.source === 'CAMPAIGN' ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-700',
                )}
              >
                {item.source === 'CAMPAIGN'
                  ? t('vaccines.adhoc.sourceLabel.campaign')
                  : t('vaccines.adhoc.sourceLabel.custom')}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
