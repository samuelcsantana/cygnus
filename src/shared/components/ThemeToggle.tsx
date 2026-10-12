import { useTranslation } from 'react-i18next'

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import type { ThemeMode } from '@/app/providers/theme-context'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import { MonitorIcon } from '@/shared/icons/monitor-icon'
import { MoonIcon } from '@/shared/icons/moon-icon'
import { SunIcon } from '@/shared/icons/sun-icon'

const THEME_ORDER: ThemeMode[] = ['light', 'dark', 'system']

const THEME_ICON: Record<ThemeMode, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
}

interface ThemeToggleProps {
  /**
   * `compact` (the default) is the header treatment on the public screens: one
   * 36px button that flips between light and dark — a moon while the page is
   * light, a sun while it is dark. `field` is the settings treatment — a 44px
   * labelled select with all three modes, the same shape as LanguageSwitcher's
   * `field`.
   *
   * The header used to cycle light → dark → system, showing only the icon of
   * the current mode, so nobody could tell what the next click would do, and
   * "system" looked exactly like a click that did nothing. Two states with the
   * icon of the destination is the form most people already know. "System"
   * still exists: it is the default until the first click, and the profile page
   * offers it back, where a person goes on purpose to choose.
   */
  variant?: 'compact' | 'field'
  className?: string
}

export function ThemeToggle({ variant = 'compact', className }: ThemeToggleProps) {
  const { t } = useTranslation()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const Icon = THEME_ICON[theme]

  if (variant === 'field') {
    return (
      <Select value={theme} onValueChange={(value) => setTheme(value as ThemeMode)}>
        <SelectTrigger
          aria-label={t('common.theme.label')}
          className={cn(
            // Deliberately the same shape as LanguageSwitcher's `field`: on the
            // profile page the two sit one above the other, and matching them
            // is the whole point of this variant existing.
            'h-11 gap-2 rounded-[10px] border-border bg-muted/50 px-3.5 text-sm text-ink data-[size=default]:h-11',
            'focus-visible:border-emerald-600 focus-visible:ring-emerald-600/40',
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Icon className="h-4 w-4 shrink-0 text-ink-faint" />
            <span className="truncate">{t(`common.theme.${theme}`)}</span>
          </span>
        </SelectTrigger>

        {/* `popper`, not the default `item-aligned`: that mode positions itself
            by measuring the trigger's SelectValue node, and this trigger has
            none — the same trap already paid for in LanguageSwitcher. */}
        <SelectContent position="popper" align="start" sideOffset={6} className="min-w-[10.5rem] rounded-xl p-1.5">
          {THEME_ORDER.map((mode) => {
            const ModeIcon = THEME_ICON[mode]
            return (
              <SelectItem
                key={mode}
                value={mode}
                className="h-9 rounded-lg pr-8 pl-2.5 data-[state=checked]:bg-emerald-50 data-[state=checked]:font-semibold data-[state=checked]:text-emerald-700 dark:data-[state=checked]:bg-emerald-500/10 dark:data-[state=checked]:text-emerald-400"
              >
                <span className="flex items-center gap-2">
                  <ModeIcon className="h-4 w-4 shrink-0 text-ink-faint" />
                  {t(`common.theme.${mode}`)}
                </span>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    )
  }

  // Driven by what is on screen, not by the stored mode: under "system" the
  // page is still light or dark, and the button has to offer the other one.
  const isDark = resolvedTheme === 'dark'
  const DestinationIcon = isDark ? SunIcon : MoonIcon
  const label = t(isDark ? 'common.theme.switchToLight' : 'common.theme.switchToDark')

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-muted hover:text-ink',
        'focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none',
        className,
      )}
    >
      <DestinationIcon className="h-4 w-4" />
    </button>
  )
}
