import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { SunIcon } from '@/shared/icons/sun-icon'
import { MoonIcon } from '@/shared/icons/moon-icon'
import { MonitorIcon } from '@/shared/icons/monitor-icon'
import { UserIcon } from '@/shared/icons/user-icon'
import { LogoutIcon } from '@/shared/icons/logout-icon'
import { SpinnerIcon } from '@/shared/icons/spinner-icon'

const modes = [
  { value: 'light', icon: SunIcon },
  { value: 'dark', icon: MoonIcon },
  { value: 'system', icon: MonitorIcon },
] as const

function AccountAvatar({ name, url }: { name: string; url?: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
    >
      {url && failedUrl !== url ? (
        <img
          src={url}
          alt=""
          className="size-full object-cover"
          onError={() => setFailedUrl(url)}
        />
      ) : name.trim() ? (
        name.trim().slice(0, 1).toUpperCase()
      ) : (
        <UserIcon className="size-5" />
      )}
    </span>
  )
}
import { LanguageSwitcher } from './LanguageSwitcher'

export function AccountMenu({
  name,
  avatarUrl,
  email,
  onLogout,
  pending,
  onNavigate,
}: {
  avatarUrl?: string | null
  name: string
  email: string
  onLogout: () => void
  pending?: boolean
  onNavigate?: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const themeId = useId()
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t('nav.shell.account')}
          className="flex min-h-11 w-full min-w-0 items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted"
        >
          <AccountAvatar name={name} url={avatarUrl} />
          <span className="min-w-0">
            <span className="block max-w-40 truncate text-sm font-semibold text-ink">{name}</span>
            <span className="block text-xs text-ink-muted">{t('nav.shell.account')}</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`ml-auto size-4 shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        collisionPadding={16}
        aria-label={t('nav.shell.account')}
        className="w-80 max-w-[calc(100vw-2rem)] max-h-[var(--radix-popover-content-available-height)] gap-0 overflow-y-auto rounded-2xl p-0 shadow-xl"
      >
        <div className="flex items-center gap-3 border-b border-border bg-muted/30 p-4">
          <AccountAvatar name={name} url={avatarUrl} />
          <div className="min-w-0">
            <p className="break-words font-semibold text-ink">{name || t('common.myAccount')}</p>
            <p className="mt-0.5 break-all text-xs leading-relaxed text-ink-muted">{email}</p>
          </div>
        </div>
        <div className="p-2">
          <Link
            to="/profile"
            onClick={() => {
              setOpen(false)
              onNavigate?.()
            }}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 font-semibold text-ink hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <UserIcon className="size-4 text-ink-muted" />
            {t('profile.page.title')}
            <ChevronRight aria-hidden="true" className="ml-auto size-4 text-ink-muted" />
          </Link>
        </div>
        <div className="space-y-4 border-t border-border p-4">
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-ink-muted">
              {t('common.theme.label')}
            </legend>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
              {modes.map(({ value, icon: Icon }) => (
                <label key={value} className="relative min-w-0 cursor-pointer">
                  <input
                    type="radio"
                    name={themeId}
                    value={value}
                    checked={theme === value}
                    onChange={() => setTheme(value)}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-medium text-ink-muted peer-checked:bg-card peer-checked:font-bold peer-checked:text-primary peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring hover:text-ink">
                    <Icon className="size-4" />
                    {t(`common.theme.${value}`)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <p className="mb-2 text-xs font-semibold text-ink-muted">
              {t('common.languageSwitcherLabel')}
            </p>
            <LanguageSwitcher variant="field" className="w-full" />
          </div>
        </div>
        <div className="border-t border-border p-2">
          <button
            type="button"
            disabled={pending}
            aria-busy={pending}
            aria-label={t(pending ? 'nav.loggingOut' : 'nav.logout')}
            onClick={() => {
              if (!pending) onLogout()
            }}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? (
              <SpinnerIcon className="size-4 animate-spin" />
            ) : (
              <LogoutIcon className="size-4" />
            )}
            <span role="status">{t(pending ? 'nav.loggingOut' : 'nav.logout')}</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
