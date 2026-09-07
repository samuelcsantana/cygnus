import { useTranslation } from 'react-i18next'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { useAgeLabel } from '@/hooks/useAgeLabel'
import { cn } from '@/lib/utils'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

interface BabySwitcherProps {
  babies: readonly Baby[]
  /** `null` is "all children", a real answer and the default. */
  value: string | null
  onChange: (babyId: string | null) => void
  className?: string
}

/**
 * The children, at the top of the menu, one of them chosen.
 *
 * This is the control that narrows the whole app: picking a child here is what
 * every list, every chart and the dashboard answer to. It replaced a row of
 * chips repeated on five pages — same job, but the choice now outlives the page
 * it was made on, which is the point.
 *
 * **"Todas as crianças" is the first row and stays.** The design this menu comes
 * from has no such thing: there, one child is always selected and the family
 * view does not exist. Here it does, and it is the thing this app does that the
 * reference does not — "how is the family doing" in one look.
 *
 * The age is shown because in a list of names it is what tells two children
 * apart at a glance, especially siblings whose names rhyme on purpose.
 */
export function BabySwitcher({ babies, value, onChange, className }: BabySwitcherProps) {
  const { t } = useTranslation()
  const ageLabel = useAgeLabel()

  const rowClass =
    'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors'

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <p className="px-3 pb-1 text-[11px] font-bold tracking-wide text-ink-faint uppercase">
        {t('babies.switcher.heading')}
      </p>

      {/* A radio group, not a list of buttons: exactly one of these is true at a
          time, and `aria-checked` is what says so to a screen reader. A row of
          plain buttons announces six independent things to press. */}
      <div role="radiogroup" aria-label={t('babies.switcher.heading')} className="flex flex-col gap-1">
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          onClick={() => onChange(null)}
          className={cn(
            rowClass,
            value === null ? 'bg-primary font-bold text-primary-foreground' : 'font-semibold text-ink-muted hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
          )}
        >
          {t('babies.switcher.all')}
        </button>

        {babies.map((baby) => {
          const appearance = babyAvatarAppearance(baby.id, baby.avatarColor)
          const isActive = value === baby.id

          return (
            <button
              key={baby.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(baby.id)}
              className={cn(
                rowClass,
                isActive ? 'bg-primary text-primary-foreground' : 'text-ink-muted hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
              )}
            >
              {baby.avatarUrl ? (
                <img
                  src={baby.avatarUrl}
                  alt=""
                  className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-black',
                    isActive ? 'bg-white/25 text-white' : appearance.className,
                  )}
                  style={isActive ? undefined : appearance.style}
                >
                  {babyInitials(baby.name)}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate font-bold">{baby.name}</span>
                {/* Full opacity on the selected row, and that is measured, not
                    taste: white at 80% over `--primary` is 4.1:1, and this is
                    12px text, which owes 4.5:1. The axe gate in the story caught
                    it. The size alone carries the hierarchy here. */}
                <span className={cn('block truncate text-xs', isActive ? 'text-primary-foreground' : 'text-ink-faint')}>
                  {ageLabel(baby.birthDate)}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
