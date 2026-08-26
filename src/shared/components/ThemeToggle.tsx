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
   * `compact` (the default) is the header treatment: a 36px icon button that
   * cycles the three modes, paired with LanguageSwitcher's compact variant.
   * `field` is the settings treatment — a 44px labelled select, the same shape
   * as LanguageSwitcher's `field`.
   *
   * The two exist for the same reason the language control has two, and the
   * argument is stronger here: cycling is fine in a header, where the control
   * is an afterthought and one tap gets you somewhere. On a settings page it
   * is the wrong affordance — the person came specifically to set this, and an
   * icon that cycles neither shows what the options are nor what the current
   * one means without decoding a glyph.
   */
  variant?: 'compact' | 'field'
  className?: string
}

export function ThemeToggle({ variant = 'compact', className }: ThemeToggleProps) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
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

  const handleClick = () => {
    const nextIndex = (THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length
    setTheme(THEME_ORDER[nextIndex]!)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t('common.theme.switchAria', { current: t(`common.theme.${theme}`) })}
      title={t(`common.theme.${theme}`)}
      className={cn(
        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-muted hover:text-ink',
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
