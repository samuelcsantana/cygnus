import { useTranslation } from 'react-i18next'

import { useTheme, type ThemeMode } from '@/app/providers/ThemeProvider'
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
  className?: string
}

// A single icon button that cycles light → dark → system → light, mirroring
// LanguageSwitcher's placement pattern (app header, both mobile and desktop,
// plus the login/register screen) but as a compact toggle rather than a
// dropdown, since there are only 3 states.
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const Icon = THEME_ICON[theme]

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
        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-slate-100 hover:text-ink',
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
