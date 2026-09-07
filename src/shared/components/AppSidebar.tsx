import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { Baby } from '@/features/babies/api/babies.schemas'

import { cn } from '@/lib/utils'
import { LogoIcon } from '@/shared/icons/logo-icon'
import { LogoutIcon } from '@/shared/icons/logout-icon'
import { PlusIcon } from '@/shared/icons/plus-icon'
import { BabySwitcher } from './BabySwitcher'
import { SidebarNavItem } from './SidebarNavItem'

export interface SidebarNavEntry {
  to: string
  label: string
  icon: ReactNode
  disabled?: boolean
}

interface AppSidebarProps {
  items: SidebarNavEntry[]
  babies: readonly Baby[]
  /** The child the whole app is narrowed to; `null` is all of them. */
  selectedBabyId: string | null
  onSelectBaby: (babyId: string | null) => void
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
  items,
  babies,
  selectedBabyId,
  onSelectBaby,
  accountName,
  accountEmail,
  onAddBaby,
  onLogout,
  logoutPending,
  onNavigate,
  className,
}: AppSidebarProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex h-full w-full flex-col border-r border-border bg-card', className)}>
      <Link to="/dashboard" onClick={onNavigate} className="flex flex-shrink-0 items-center gap-3 px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
          <LogoIcon className="h-5 w-5" />
        </span>
        <span className="font-display text-xl font-extrabold tracking-tight text-ink">{t('common.appName')}</span>
      </Link>

      {/* The children first, then the sections: the menu reads "who am I
          looking at" before "at what". Only when there is more than one — a
          single-child household has nothing to switch between, and a radio group
          of one is furniture. */}
      {babies.length > 1 && (
        <div className="flex-shrink-0 px-3 pb-3">
          <BabySwitcher babies={babies} value={selectedBabyId} onChange={onSelectBaby} />
        </div>
      )}

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
      <nav aria-label={t('nav.sections')} className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {items.map((item) => (
          <SidebarNavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="flex-shrink-0 border-t border-border px-3 py-3">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-bold text-ink">{accountName}</p>
          <p className="truncate text-xs text-ink-faint">{accountEmail}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          disabled={logoutPending}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
        >
          <LogoutIcon className="h-5 w-5 flex-shrink-0" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  )
}
