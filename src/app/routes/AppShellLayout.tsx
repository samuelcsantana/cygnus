import { useTranslation } from 'react-i18next'
import { Outlet, useNavigate } from 'react-router-dom'

import { useLogout } from '@/features/auth/api/auth.hooks'
import { useBabies } from '@/features/babies/api/babies.hooks'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { CalendarIcon } from '@/shared/icons/calendar-icon'
import { DashboardIcon } from '@/shared/icons/dashboard-icon'
import { LogoIcon } from '@/shared/icons/logo-icon'
import { LogoutIcon } from '@/shared/icons/logout-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'
import { MobileNavItem } from '@/shared/components/MobileNavItem'
import { NavItem } from '@/shared/components/NavItem'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'

export function AppShellLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const babies = useBabies()
  const identity = useAuthIdentityStore((state) => state.identity)
  const logout = useLogout()

  const hasBabies = (babies.data?.length ?? 0) > 0

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: <DashboardIcon className="h-5 w-5" /> },
    { to: '/vaccines', label: t('nav.vaccines'), icon: <SyringeIcon className="h-5 w-5" /> },
    { to: '/appointments', label: t('nav.appointments'), icon: <CalendarIcon className="h-5 w-5" /> },
    { to: '/milestones', label: t('nav.milestones'), icon: <SparkleIcon className="h-5 w-5" /> },
  ]

  const handleLogout = async () => {
    await logout.mutateAsync()
    navigate('/login', { replace: true })
  }

  const accountLabel = identity?.name ?? identity?.email ?? t('common.myAccount')

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 md:flex-row">
      <aside className="sticky top-0 z-20 hidden h-screen w-[280px] flex-col border-r border-slate-100 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] md:flex">
        <div className="flex items-center space-x-3 p-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
            <LogoIcon className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">{t('common.appName')}</span>
        </div>

        <nav className="mt-4 flex-1 space-y-1.5 overflow-y-auto px-4">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} disabled={!hasBabies} />
          ))}
        </nav>

        <div className="p-6">
          <button
            type="button"
            onClick={handleLogout}
            disabled={logout.isPending}
            className="flex w-full items-center justify-center rounded-2xl bg-slate-100/80 px-4 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-60"
          >
            <LogoutIcon className="mr-2 h-4 w-4 text-slate-500" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      <main className="flex h-screen flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur-md md:hidden">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <LogoIcon className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-slate-900">{t('common.appName')}</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="text-sm font-semibold text-slate-600">{accountLabel}</span>
          </div>
        </header>

        <header className="sticky top-0 z-20 hidden items-center justify-end gap-4 border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur-md md:flex">
          <NotificationBell />
          <div className="h-8 w-px bg-slate-200" />
          <span className="text-sm font-bold text-slate-700">{accountLabel}</span>
        </header>

        <div className="flex-1 overflow-y-auto p-5 pb-24 md:p-10 md:pb-10 lg:p-12">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </div>
      </main>

      <nav className="pb-safe fixed right-0 bottom-0 left-0 z-30 flex justify-around border-t border-slate-200 bg-white/90 p-2 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] backdrop-blur-md md:hidden">
        {navItems.map((item) => (
          <MobileNavItem key={item.to} {...item} disabled={!hasBabies} />
        ))}
      </nav>
    </div>
  )
}
