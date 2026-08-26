import { useTranslation } from 'react-i18next'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { cn } from '@/lib/utils'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

interface BabyFilterChipsProps {
  babies: Baby[]
  /** `null` means "all babies". */
  value: string | null
  onChange: (babyId: string | null) => void
  className?: string
}

// Local (non-global) per-list baby filter — this codebase deliberately has no
// global "currently selected baby" store, so this is plain component state
// owned by whichever list renders the chips, not Zustand.
export function BabyFilterChips({ babies, value, onChange, className }: BabyFilterChipsProps) {
  const { t } = useTranslation()

  // Filtering by baby is pointless (and visually redundant) for a single-child household.
  if (babies.length < 2) {
    return null
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="group" aria-label={t('common.babyFilter.groupLabel')}>
      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={value === null}
        className={cn(
          'rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors',
          value === null ? 'bg-primary text-primary-foreground' : 'bg-card text-ink-muted shadow-sm hover:bg-muted',
        )}
      >
        {t('common.babyFilter.all')}
      </button>
      {babies.map((baby) => {
        const appearance = babyAvatarAppearance(baby.id, baby.avatarColor)
        const isActive = value === baby.id
        return (
          <button
            key={baby.id}
            type="button"
            onClick={() => onChange(baby.id)}
            aria-pressed={isActive}
            className={cn(
              'flex items-center gap-1.5 rounded-full py-1.5 pr-4 pl-1.5 text-[13px] font-semibold transition-colors',
              isActive ? 'bg-primary text-primary-foreground' : 'bg-card text-ink-muted shadow-sm hover:bg-muted',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-black',
                isActive ? 'bg-white/25 text-white' : appearance.className,
              )}
              style={isActive ? undefined : appearance.style}
            >
              {babyInitials(baby.name)}
            </span>
            {baby.name}
          </button>
        )
      })}
    </div>
  )
}
