import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { BrandSignature } from './BrandSignature'
import { PlusIcon } from '@/shared/icons/plus-icon'
import { AccountMenu } from './AccountMenu'
import { SidebarNavItem } from './SidebarNavItem'

export interface SidebarNavEntry {
  to: string
  label: string
  icon: ReactNode
  disabled?: boolean
}

interface AppSidebarProps {
  showAccount?: boolean
  items: SidebarNavEntry[]
  accountAvatarUrl?: string | null
  accountName: string
  accountEmail: string
  onAddBaby: () => void
  onLogout: () => void
  logoutPending?: boolean
  /** Called after any navigation, so the phone drawer closes behind the tap. */
  onNavigate?: () => void
  className?: string
}

/**
 * The side menu: brand, "add a child", the sections, and the account at the
 * foot. It is the same component in both places — a column on wide screens, the
 * contents of the drawer on phones — because the two must not drift; the bottom
 * bar and the top nav it replaces were two lists of the same routes, written
 * twice.
 *
 * It takes everything it renders as props and holds no state. That is what lets
 * the story mount it and measure it: the real shell reaches into three stores, a
 * mutation and two queries to build the same tree, and none of that is available
 * to a story. It is also the reason the media query lives in the shell — an
 * element that is `display: none` has no boxes, and a measurement of nothing
 * passes.
 */
export function AppSidebar({
  showAccount = false,
  items,
  accountName,
  accountAvatarUrl,
  accountEmail,
  onAddBaby,
  onLogout,
  logoutPending,
  onNavigate,
  className,
}: AppSidebarProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full flex-col border-r border-border bg-card',
        className,
      )}
    >
      <Link
        to="/dashboard"
        onClick={onNavigate}
        className="flex flex-shrink-0 items-center gap-3 px-5 py-4"
      >
        <BrandSignature compact />
      </Link>

      <div className="flex-shrink-0 px-3 pb-3">
        <button
          type="button"
          onClick={onAddBaby}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-dashed border-emerald-200 px-3 py-2 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
        >
          <PlusIcon className="h-5 w-5 flex-shrink-0" />
          <span>{t('babies.addChild')}</span>
        </button>
      </div>

      {/* Scrolls on its own, so the account foot stays reachable on a short
          phone in landscape — 320x360 is where a seventh section first pushes
          "Sair da conta" off the column. */}
      <nav aria-label={t('nav.sections')} className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {['overview', 'care', 'development'].map((group) => (
          <div key={group} className="mb-3 space-y-1">
            {group !== 'overview' && (
              <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                {t(`nav.shell.${group}`)}
              </p>
            )}
            {items
              .filter(
                (item) =>
                  (item.to === '/dashboard'
                    ? 'overview'
                    : ['/crescimento', '/milestones'].includes(item.to)
                      ? 'development'
                      : 'care') === group,
              )
              .map((item) => (
                <SidebarNavItem key={item.to} {...item} onNavigate={onNavigate} />
              ))}
          </div>
        ))}
      </nav>

      {showAccount && (
        <div className="shrink-0 border-t border-border p-3">
          <AccountMenu
            avatarUrl={accountAvatarUrl}
            name={accountName}
            email={accountEmail}
            onLogout={onLogout}
            pending={logoutPending}
            onNavigate={onNavigate}
          />
        </div>
      )}
    </div>
  )
}
