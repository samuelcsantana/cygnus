import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { BellIcon } from '@/shared/icons/bell-icon'
import { MenuIcon } from '@/shared/icons/menu-icon'
import { SearchIcon } from '@/shared/icons/search-icon'
import { FamilyContext, type FamilyContextProps } from './FamilyContext'
import { AccountMenu } from './AccountMenu'

interface Props extends FamilyContextProps {
  menuOpen: boolean
  onOpenMenu: () => void
  onSearch: () => void
  unreadCount: number
  accountAvatarUrl?: string | null
  accountName: string
  accountEmail: string
  onLogout: () => void
  logoutPending?: boolean
}
export function AppHeader(props: Props) {
  const { t } = useTranslation()
  return (
    <header className="sticky top-0 z-20 flex min-h-18 items-center gap-2 border-b border-border bg-card/95 px-3 py-3 backdrop-blur-md lg:gap-5 lg:px-8 print:hidden">
      <button
        type="button"
        onClick={props.onOpenMenu}
        aria-label={t('nav.openMenu')}
        aria-expanded={props.menuOpen}
        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-muted hover:bg-muted lg:hidden"
      >
        <MenuIcon className="size-5" />
      </button>
      <div className="min-w-0 flex-1 lg:max-w-60">
        <FamilyContext {...props} />
      </div>
      <button
        type="button"
        onClick={props.onSearch}
        className="ml-auto hidden min-h-11 max-w-72 flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-left text-sm text-ink-muted xl:flex"
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="truncate">{t('search.placeholder')}</span>
      </button>
      <button
        type="button"
        onClick={props.onSearch}
        aria-label={t('search.open')}
        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-muted hover:bg-muted xl:hidden"
      >
        <SearchIcon className="size-5" />
      </button>
      <Link
        to="/notifications"
        aria-label={
          props.unreadCount
            ? `${t('nav.notifications')}, ${t('notifications.unreadCount', { count: props.unreadCount })}`
            : t('nav.notifications')
        }
        className="relative flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-muted hover:bg-muted"
      >
        <BellIcon className="size-5" />
        {props.unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-0.5 top-0.5 rounded-full bg-rose-700 px-1.5 text-[10px] font-bold text-white"
          >
            {props.unreadCount > 9 ? '9+' : props.unreadCount}
          </span>
        )}
      </Link>
      <div className="hidden max-w-56 border-l border-border pl-3 lg:block">
        <AccountMenu
          avatarUrl={props.accountAvatarUrl}
          name={props.accountName}
          email={props.accountEmail}
          onLogout={props.onLogout}
          pending={props.logoutPending}
        />
      </div>
    </header>
  )
}
