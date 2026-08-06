import { useTranslation } from 'react-i18next'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { ageInMonths } from '@/lib/date'
import { cn } from '@/lib/utils'
import { PencilIcon } from '@/shared/icons/pencil-icon'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

export interface FamilyStripItem {
  baby: Baby
  delayedVaccineCount: number
}

interface FamilyStripProps {
  items: FamilyStripItem[]
  onEdit: (baby: Baby) => void
}

// Compact per-child roster replacing what used to be a full stats+lists
// section per baby — one glance at who's who and who needs attention,
// without repeating the same big layout once per child.
export function FamilyStrip({ items, onEdit }: FamilyStripProps) {
  const { t } = useTranslation()

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {items.map(({ baby, delayedVaccineCount }) => {
        const avatarAppearance = babyAvatarAppearance(baby.id, baby.avatarColor)
        return (
          <div
            key={baby.id}
            className="group flex flex-shrink-0 items-center gap-3 rounded-2xl bg-white py-2.5 pr-2 pl-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
          >
            {baby.avatarUrl ? (
              <img
                src={baby.avatarUrl}
                alt=""
                className={cn(
                  'h-11 w-11 flex-shrink-0 rounded-full bg-teal-50 object-cover',
                  baby.avatarColor && 'border-2',
                )}
                style={baby.avatarColor ? { borderColor: baby.avatarColor } : undefined}
              />
            ) : (
              <span
                className={cn(
                  'font-display flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-base font-black',
                  avatarAppearance.className,
                )}
                style={avatarAppearance.style}
              >
                {babyInitials(baby.name)}
              </span>
            )}
            <div className="min-w-0 pr-1">
              <p className="truncate text-[13px] font-bold text-ink">{baby.name}</p>
              <p className="text-[11px] text-ink-muted">{t('babies.monthsOld', { count: ageInMonths(baby.birthDate) })}</p>
              {delayedVaccineCount > 0 ? (
                <p className="text-[11px] font-bold text-rose-600">
                  {t('babies.dashboard.familyStripDelayed', { count: delayedVaccineCount })}
                </p>
              ) : (
                <p className="text-[11px] font-bold text-teal-600">{t('babies.dashboard.familyStripUpToDate')}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onEdit(baby)}
              aria-label={t('babies.edit.action', { name: baby.name })}
              className="flex-shrink-0 self-start rounded-lg p-1.5 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-100 hover:text-teal-600"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
