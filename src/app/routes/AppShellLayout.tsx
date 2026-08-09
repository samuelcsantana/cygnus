import { useTranslation } from 'react-i18next'
import { Link, Outlet, useNavigate } from 'react-router-dom'

import { useLogout } from '@/features/auth/api/auth.hooks'
import { useBabies } from '@/features/babies/api/babies.hooks'
import { AddBabyDialog } from '@/features/babies/components/AddBabyDialog'
import { useNotifications } from '@/features/notifications/api/notifications.hooks'
import { BellIcon } from '@/shared/icons/bell-icon'
import { DashboardIcon } from '@/shared/icons/dashboard-icon'
import { LogoIcon } from '@/shared/icons/logo-icon'
import { LogoutIcon } from '@/shared/icons/logout-icon'
import { PlusIcon } from '@/shared/icons/plus-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'
import { UserIcon } from '@/shared/icons/user-icon'
import { MobileNavItem } from '@/shared/components/MobileNavItem'
import { OfflineBanner } from '@/shared/components/OfflineBanner'
import { ThemeToggle } from '@/shared/components/ThemeToggle'
import { TopNavItem } from '@/shared/components/TopNavItem'
import { useAddBabyDialogStore } from '@/shared/stores/addBabyDialog.store'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'

export function AppShellLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const babies = useBabies()
  const notifications = useNotifications()
  const identity = useAuthIdentityStore((state) => state.identity)
  const logout = useLogout()
  const isAddBabyDialogOpen = useAddBabyDialogStore((state) => state.isOpen)
  const openAddBabyDialog = useAddBabyDialogStore((state) => state.open)
  const closeAddBabyDialog = useAddBabyDialogStore((state) => state.close)

  const hasBabies = (babies.data?.length ?? 0) > 0
  const unreadCount = notifications.data?.filter((n) => !n.readAt).length ?? 0

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: <DashboardIcon className="h-5 w-5" /> },
    { to: '/vaccines', label: t('nav.vaccines'), icon: <SyringeIcon className="h-5 w-5" /> },
    { to: '/appointments', label: t('nav.appointments'), icon: <StethoscopeIcon className="h-5 w-5" /> },
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

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-20 hidden items-center gap-6 border-b border-slate-100 bg-white/90 px-8 py-3 backdrop-blur-md md:flex">
        <Link to="/dashboard" className="flex flex-shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-md">
            <LogoIcon className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight text-ink">{t('common.appName')}</span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-1.5">
          {navItems.map((item) => (
            <TopNavItem key={item.to} {...item} disabled={!hasBabies && item.to !== '/notifications'} />
          ))}
        </nav>

        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={openAddBabyDialog}
            title={t('babies.addChild')}
            aria-label={t('babies.addChild')}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-dashed border-teal-200 px-3 py-1.5 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-50"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            {t('babies.addChild')}
          </button>
          <ThemeToggle />
          <Link
            to="/profile"
            className="flex items-center gap-2.5 rounded-full py-1.5 pr-3 pl-1.5 transition-colors hover:bg-teal-50/60"
            title={t('profile.nav.viewProfile')}
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <UserIcon className="h-4 w-4" />
            </span>
            <span className="max-w-[10rem] truncate text-[13px] font-bold text-ink">
              {identity?.name ?? accountLabel}
            </span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={logout.isPending}
            title={t('nav.logout')}
            aria-label={t('nav.logout')}
            className="flex-shrink-0 rounded-lg p-2 text-ink-faint transition-colors hover:text-rose-500 disabled:opacity-60"
          >
            <LogoutIcon className="h-4 w-4" />
          </button>
        </div>
      </header>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur-md md:hidden">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-white">
            <LogoIcon className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-extrabold text-ink">{t('common.appName')}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openAddBabyDialog}
            aria-label={t('babies.addChild')}
            className="rounded-lg p-1.5 text-teal-700"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
          <ThemeToggle />
          <Link to="/profile" aria-label={t('profile.nav.viewProfile')} className="rounded-lg p-1.5 text-ink-muted">
            <UserIcon className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <OfflineBanner />

      <main className="flex-1 p-5 pb-24 md:p-10 md:pb-10 lg:p-12">
        <Outlet />
      </main>

      <nav className="pb-safe fixed right-0 bottom-0 left-0 z-30 flex justify-around border-t border-slate-200 bg-white/90 p-2 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] backdrop-blur-md md:hidden">
        {navItems.map((item) => (
          <MobileNavItem key={item.to} {...item} disabled={!hasBabies && item.to !== '/notifications'} />
        ))}
      </nav>

      <AddBabyDialog open={isAddBabyDialogOpen} onOpenChange={(open) => !open && closeAddBabyDialog()} />
    </div>
  )
}
