import { useTranslation } from 'react-i18next'

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { GlobeIcon } from '@/shared/icons/globe-icon'

// Each language's own name, in that language — not translated, per standard
// language-switcher UX (a Spanish speaker looks for "Español", not "Espanhol").
// `short` is what the compact control shows.
const LANGUAGE_OPTIONS = [
  { value: 'pt-BR', label: 'Português', short: 'PT' },
  { value: 'en', label: 'English', short: 'EN' },
  { value: 'es', label: 'Español', short: 'ES' },
] as const

interface LanguageSwitcherProps {
  /**
   * `compact` (the default) is the header treatment on the public screens: the
   * three codes side by side, PT · EN · ES, 36px tall to pair with ThemeToggle.
   * `field` is the settings treatment — the same 44px tinted input the auth
   * screens use — so the profile page's controls line up with the form fields
   * stacked below them.
   */
  variant?: 'compact' | 'field'
  className?: string
}

// Emerald focus ring rather than the default --ring: it is the accent every
// other control on the auth screens uses, and this one sits among them.
const TRIGGER_BASE = 'focus-visible:border-emerald-600 focus-visible:ring-emerald-600/40'

// The height is written as `data-[size=default]:h-*` rather than a bare `h-*`:
// SelectTrigger sets its own height through that same variant, and a plain
// utility loses to it on variant order. Matching the variant is also what lets
// tailwind-merge drop the primitive's value instead of emitting both.
const FIELD_TRIGGER =
  'h-11 gap-2 rounded-[10px] border-border bg-muted/50 px-3.5 text-sm text-ink data-[size=default]:h-11'

export function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()

  const active = LANGUAGE_OPTIONS.find((option) => option.value === i18n.resolvedLanguage) ?? LANGUAGE_OPTIONS[0]

  if (variant === 'compact') {
    return (
      // All three codes on screen instead of a closed list reading "Português".
      // The public screens are where a recruiter from abroad lands, and the
      // control they need is the one they should not have to open anything to
      // find. Three short buttons fit where the old trigger did.
      <div
        role="group"
        aria-label={t('common.languageSwitcherLabel')}
        className={cn('relative inline-flex h-9 items-center rounded-[10px] border border-border bg-card p-0.5', className)}
      >
        {/* The highlight is one element that slides to the chosen code, so a
            change of language reads as a move from one code to the other. As a
            background on each button it vanished from one and appeared on the
            next in the same frame. The buttons share one width so the slide is
            a whole number of button widths, and so the group never changes size
            either. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0.5 left-0.5 w-9 rounded-[7px] bg-emerald-50 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out dark:bg-emerald-500/10"
          style={{ transform: `translateX(${LANGUAGE_OPTIONS.indexOf(active) * 100}%)` }}
        />
        {LANGUAGE_OPTIONS.map((language) => {
          const isActive = language.value === active.value
          return (
            <button
              key={language.value}
              type="button"
              lang={language.value}
              aria-pressed={isActive}
              onClick={() => void i18n.changeLanguage(language.value)}
              className={cn(
                'relative inline-flex h-full w-9 items-center justify-center rounded-[7px] text-[12.5px] font-semibold tracking-wide transition-colors',
                'focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none',
                isActive ? 'text-emerald-800 dark:text-emerald-300' : 'text-ink-muted hover:text-ink',
              )}
            >
              {language.short}
              {/* The visible code stays in the accessible name (WCAG 2.5.3:
                  someone using voice control says "PT"), and the full name
                  follows it for a screen reader. */}
              <span className="sr-only"> ({language.label})</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <Select value={active.value} onValueChange={(value) => void i18n.changeLanguage(value)}>
      <SelectTrigger
        aria-label={t('common.languageSwitcherLabel')}
        className={cn(TRIGGER_BASE, FIELD_TRIGGER, className)}
      >
        {/* Icon and label are one group so SelectTrigger's `justify-between`
            has two children to push apart, not three. Left as three, a
            full-width trigger spreads them evenly and strands the label in the
            middle of the control. */}
        <span className="flex min-w-0 items-center gap-2">
          <GlobeIcon className="h-4 w-4 shrink-0 text-ink-faint" />
          {/* Rendered by hand instead of through SelectValue. The sr-only copy
              keeps the name in the trigger's text, so the current value is
              announced — aria-label alone names the control but says nothing
              about what is selected. */}
          <span aria-hidden className="truncate">
            {active.label}
          </span>
          <span className="sr-only">{active.label}</span>
        </span>
      </SelectTrigger>

      {/* `popper`, not SelectContent's default `item-aligned`. Item-aligned
          positions the menu by measuring the trigger's SelectValue node so the
          current option lands over it — and this trigger has no SelectValue, so
          that measurement collapses and the menu opens at x:0 far below the
          fold. Verified both ways: with SelectValue it opened at 1144,36; with
          the hand-rolled trigger, 0,797. popper anchors to the trigger element
          itself, which is what a menu this small should do anyway. */}
      <SelectContent position="popper" align="start" sideOffset={6} className="min-w-[10.5rem] rounded-xl p-1.5">
        {LANGUAGE_OPTIONS.map((language) => (
          <SelectItem
            key={language.value}
            value={language.value}
            // The selected row is marked three ways — tint, weight and the
            // primitive's check — so the state never rests on colour alone.
            className="h-9 rounded-lg pr-8 pl-2.5 data-[state=checked]:bg-emerald-50 data-[state=checked]:font-semibold data-[state=checked]:text-emerald-700 dark:data-[state=checked]:bg-emerald-500/10 dark:data-[state=checked]:text-emerald-400"
          >
            {language.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
