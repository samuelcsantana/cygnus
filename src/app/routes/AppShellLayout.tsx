import { useTranslation } from 'react-i18next'
import { Outlet, useNavigate } from 'react-router-dom'

import { useLogout } from '@/features/auth/api/auth.hooks'
import { useBabies } from '@/features/babies/api/babies.hooks'
import { useNotifications } from '@/features/notifications/api/notifications.hooks'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { BellIcon } from '@/shared/icons/bell-icon'
import { CalendarIcon } from '@/shared/icons/calendar-icon'
import { DashboardIcon } from '@/shared/icons/dashboard-icon'
import { LogoIcon } from '@/shared/icons/logo-icon'
import { LogoutIcon } from '@/shared/icons/logout-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { MobileNavItem } from '@/shared/components/MobileNavItem'
import { NavItem } from '@/shared/components/NavItem'
import { SidebarBabySwitcher } from '@/shared/components/SidebarBabySwitcher'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'
import { defaultAvatarDataUri } from '@/shared/utils/defaultAvatar'

export function AppShellLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const babies = useBabies()
  const notifications = useNotifications()
  const identity = useAuthIdentityStore((state) => state.identity)
  const logout = useLogout()

  const hasBabies = (babies.data?.length ?? 0) > 0
  const unreadCount = notifications.data?.filter((n) => !n.readAt).length ?? 0

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: <DashboardIcon className="h-5 w-5" /> },
    { to: '/vaccines', label: t('nav.vaccines'), icon: <SyringeIcon className="h-5 w-5" /> },
    { to: '/appointments', label: t('nav.appointments'), icon: <CalendarIcon className="h-5 w-5" /> },
    { to: '/milestones', label: t('nav.milestones'), icon: <SparkleIcon className="h-5 w-5" /> },
    {
      to: '/notifications',
      label: t('nav.notifications'),
      icon: <BellIcon className="h-5 w-5" />,
      badge: unreadCount,
    },
  ]

  const handleLogout = async () => {
    await logout.mutateAsync()
    navigate('/login', { replace: true })
  }

  const accountLabel = identity?.name ?? identity?.email ?? t('common.myAccount')
  const accountAvatar = defaultAvatarDataUri(accountLabel)

  return (
    <div className="flex min-h-screen flex-col bg-surface md:flex-row">
      <aside className="sticky top-0 z-20 hidden h-screen w-[280px] flex-col border-r border-slate-100 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] md:flex">
        <div className="flex items-center space-x-3 p-8 pb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-md">
            <LogoIcon className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight text-ink">{t('common.appName')}</span>
        </div>

        <SidebarBabySwitcher />

        <nav className="mt-4 flex-1 space-y-1.5 overflow-y-auto px-4">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} disabled={!hasBabies && item.to !== '/notifications'} />
          ))}
        </nav>

        <div className="border-t border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <img src={accountAvatar} alt="" className="h-9 w-9 flex-shrink-0 rounded-full bg-teal-50" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-ink">{identity?.name ?? accountLabel}</p>
              <p className="truncate text-[11px] text-ink-muted">{identity?.email ?? ''}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logout.isPending}
              title={t('nav.logout')}
              aria-label={t('nav.logout')}
              className="flex-shrink-0 rounded-lg p-1.5 text-ink-faint transition-colors hover:text-rose-500 disabled:opacity-60"
            >
              <LogoutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex h-screen flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur-md md:hidden">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-white">
              <LogoIcon className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-extrabold text-ink">{t('common.appName')}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <NotificationBell />
          </div>
        </header>

        <header className="sticky top-0 z-20 hidden items-center justify-end gap-4 border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur-md md:flex">
          <LanguageSwitcher />
          <div className="h-8 w-px bg-slate-200" />
          <NotificationBell />
        </header>

        <div className="flex-1 overflow-y-auto p-5 pb-24 md:p-10 md:pb-10 lg:p-12">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </div>
      </main>

      <nav className="pb-safe fixed right-0 bottom-0 left-0 z-30 flex justify-around border-t border-slate-200 bg-white/90 p-2 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] backdrop-blur-md md:hidden">
        {navItems.map((item) => (
          <MobileNavItem key={item.to} {...item} disabled={!hasBabies && item.to !== '/notifications'} />
        ))}
      </nav>
    </div>
  )
}
