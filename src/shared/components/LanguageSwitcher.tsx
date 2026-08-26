import { useTranslation } from 'react-i18next'

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { GlobeIcon } from '@/shared/icons/globe-icon'

// Each language's own name, in that language — not translated, per standard
// language-switcher UX (a Spanish speaker looks for "Español", not "Espanhol").
// `short` is what the compact trigger falls back to on a narrow viewport: the
// control sits beside a 36px icon button in the header, and "Português" is wide
// enough there to push the pair out of shape on a small phone.
const LANGUAGE_OPTIONS = [
  { value: 'pt-BR', label: 'Português', short: 'PT' },
  { value: 'en', label: 'English', short: 'EN' },
  { value: 'es', label: 'Español', short: 'ES' },
] as const

interface LanguageSwitcherProps {
  /**
   * `compact` (the default) is the header treatment: ghost, 36px tall, sized
   * and shaped to pair with ThemeToggle. `field` is the settings treatment —
   * the same 44px tinted input the auth screens use — so the profile page's
   * controls line up with the form fields stacked below them.
   */
  variant?: 'compact' | 'field'
  className?: string
}

// Emerald focus ring rather than the default --ring: it is the accent every
// other control on the auth screens uses, and this one sits among them.
const TRIGGER_BASE = 'focus-visible:border-emerald-600 focus-visible:ring-emerald-600/40'

// The heights are written as `data-[size=default]:h-*` rather than a bare
// `h-*`: SelectTrigger sets its own height through that same variant, and a
// plain utility loses to it on variant order. Matching the variant is also what
// lets tailwind-merge drop the primitive's value instead of emitting both.
const TRIGGER_VARIANT = {
  compact:
    'h-9 gap-1.5 rounded-lg border-transparent px-2 text-[13px] font-medium text-ink-muted hover:bg-muted hover:text-ink data-[size=default]:h-9',
  field:
    'h-11 gap-2 rounded-[10px] border-border bg-muted/50 px-3.5 text-sm text-ink data-[size=default]:h-11',
} as const

export function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()

  const active = LANGUAGE_OPTIONS.find((option) => option.value === i18n.resolvedLanguage) ?? LANGUAGE_OPTIONS[0]

  return (
    <Select value={active.value} onValueChange={(value) => void i18n.changeLanguage(value)}>
      <SelectTrigger
        aria-label={t('common.languageSwitcherLabel')}
        className={cn(TRIGGER_BASE, TRIGGER_VARIANT[variant], className)}
      >
        {/* Icon and label are one group so SelectTrigger's `justify-between`
            has two children to push apart, not three. Left as three, a
            full-width `field` trigger spreads them evenly and strands the
            label in the middle of the control. */}
        <span className="flex min-w-0 items-center gap-2">
          <GlobeIcon className="h-4 w-4 shrink-0 text-ink-faint" />
          {/* Rendered by hand instead of through SelectValue, which can only
              mirror the option's own text: the compact trigger needs to drop to
              "PT" on a narrow screen while the menu keeps saying "Português".
              The sr-only copy keeps the full name in the trigger's text either
              way, so the current value is still announced — aria-label alone
              names the control but says nothing about what is selected. */}
          {variant === 'compact' ? (
            <>
              <span aria-hidden className="sm:hidden">
                {active.short}
              </span>
              <span aria-hidden className="hidden truncate sm:inline">
                {active.label}
              </span>
            </>
          ) : (
            <span aria-hidden className="truncate">
              {active.label}
            </span>
          )}
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
      <SelectContent
        position="popper"
        align={variant === 'compact' ? 'end' : 'start'}
        sideOffset={6}
        className="min-w-[10.5rem] rounded-xl p-1.5"
      >
        {LANGUAGE_OPTIONS.map((language) => (
          <SelectItem
            key={language.value}
            value={language.value}
            // The selected row is marked three ways — tint, weight and the
            // primitive's check — so the state never rests on colour alone.
            className="h-9 rounded-lg pr-8 pl-2.5 data-[state=checked]:bg-emerald-50 dark:data-[state=checked]:bg-emerald-950/40 data-[state=checked]:font-semibold data-[state=checked]:text-emerald-700 dark:data-[state=checked]:text-emerald-300 dark:data-[state=checked]:bg-emerald-500/10 dark:data-[state=checked]:text-emerald-400"
          >
            {language.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
