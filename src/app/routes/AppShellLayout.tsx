import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useLogout } from '@/features/auth/api/auth.hooks'
import { useBabies } from '@/features/babies/api/babies.hooks'
import { AddBabyDialog } from '@/features/babies/components/AddBabyDialog'
import { useNotifications } from '@/features/notifications/api/notifications.hooks'
import { BellIcon } from '@/shared/icons/bell-icon'
import { DashboardIcon } from '@/shared/icons/dashboard-icon'
import { GrowthIcon } from '@/shared/icons/growth-icon'
import { LogoIcon } from '@/shared/icons/logo-icon'
import { MenuIcon } from '@/shared/icons/menu-icon'
import { HeartIcon } from '@/shared/icons/heart-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'
import { UsersIcon } from '@/shared/icons/users-icon'
import { AppSidebar } from '@/shared/components/AppSidebar'
import { OfflineBanner } from '@/shared/components/OfflineBanner'
import { ThemeToggle } from '@/shared/components/ThemeToggle'
import { useAddBabyDialogStore } from '@/shared/stores/addBabyDialog.store'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'

export function AppShellLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const babies = useBabies()
  const notifications = useNotifications()
  const identity = useAuthIdentityStore((state) => state.identity)
  const logout = useLogout()
  const isAddBabyDialogOpen = useAddBabyDialogStore((state) => state.isOpen)
  const openAddBabyDialog = useAddBabyDialogStore((state) => state.open)
  const closeAddBabyDialog = useAddBabyDialogStore((state) => state.close)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const hasBabies = (babies.data?.length ?? 0) > 0
  const unreadCount = notifications.data?.filter((n) => !n.readAt).length ?? 0

  // Notifications is not among them: it lives in the top bar as the bell, where
  // its unread count is readable from every page. Listing it here as well would
  // put two links to the same route on screen at once — a second thing to keep
  // in sync, and an ambiguous target for anyone navigating by name.
  const sections = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: <DashboardIcon className="h-5 w-5" /> },
    { to: '/vaccines', label: t('nav.vaccines'), icon: <SyringeIcon className="h-5 w-5" /> },
    { to: '/appointments', label: t('nav.appointments'), icon: <StethoscopeIcon className="h-5 w-5" /> },
    // Beside appointments, not at the end: a professional is who the appointment is with, and the
    // page is reached from the same intent.
    { to: '/profissionais', label: t('nav.specialists'), icon: <UsersIcon className="h-5 w-5" /> },
    { to: '/medications', label: t('nav.medications'), icon: <HeartIcon className="h-5 w-5" /> },
    { to: '/crescimento', label: t('nav.growth'), icon: <GrowthIcon className="h-5 w-5" /> },
    { to: '/milestones', label: t('nav.milestones'), icon: <SparkleIcon className="h-5 w-5" /> },
  ]

  const navItems = sections.map((item) => ({ ...item, disabled: !hasBabies }))

  // The name of the section on screen, for the top bar on wide screens: the
  // sidebar shows which row is active, but the content starts with no frame
  // around it. Read off the nav labels rather than from a second map of titles —
  // a page that is not a section of the menu (the health plan, the profile)
  // already names itself in its own heading, and a title invented here would be
  // one more string to translate and to keep in step with the one below it.
  const activeSection = navItems.find(
    (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
  )
  const sectionTitle = location.pathname.startsWith('/notifications')
    ? t('nav.notifications')
    : (activeSection?.label ?? t('common.appName'))

  const handleLogout = async () => {
    try {
      await logout.mutateAsync()
    } catch {
      // Fica onde está, de propósito. O caminho tentador é limpar a identidade
      // e navegar assim mesmo — a pessoa pediu para sair, afinal. Mas o cookie
      // de sessão é HttpOnly: o cliente não consegue apagá-lo, e se o servidor
      // não confirmou a saída, ele continua válido. Navegar deixaria alguém
      // *parecendo* deslogado sem estar, e voltar para /dashboard reabriria a
      // sessão pelo refresh silencioso. Num app de saúde infantil, num aparelho
      // que pode ser compartilhado, essa mentira é pior que o erro.
      //
      // Falhar aqui é comum, não exótico: a API dorme no plano gratuito do
      // Render e leva ~1 min para acordar.
      toast.error(t('nav.logoutError'))
      return
    }
    navigate('/login', { replace: true })
  }

  const accountLabel = identity?.name ?? identity?.email ?? t('common.myAccount')
  const accountInitial = accountLabel.trim().slice(0, 1).toUpperCase()

  const sidebar = (onNavigate?: () => void) => (
    <AppSidebar
      items={navItems}
      accountName={accountLabel}
      accountEmail={identity?.email ?? ''}
      onAddBaby={() => {
        onNavigate?.()
        openAddBabyDialog()
      }}
      onLogout={handleLogout}
      logoutPending={logout.isPending}
      onNavigate={onNavigate}
    />
  )

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Primeiro elemento focável da página, invisível até receber foco.
          Sem ele, quem navega por teclado atravessa a navegação inteira em
          **toda** página antes de chegar no conteúdo — medido: 11 Tabs, com o
          caminho passando por logo, cinco itens de menu, adicionar filho, tema,
          conta e sair. WCAG 2.4.1, nível A.

          `sr-only focus:not-sr-only` é o padrão: some do fluxo visual e volta
          assim que o foco chega, para quem enxerga e navega por teclado ver
          onde está. */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground"
      >
        {t('nav.skipToContent')}
      </a>

      {/* The column, from `lg` up. Below that width the same menu is the drawer
          at the bottom of this file — one component, so the two cannot drift the
          way the top bar and the bottom bar did, each listing the same routes in
          its own file.

          `h-dvh`, not `h-screen`: on a phone `100vh` is the viewport without the
          browser chrome, which puts the account footer under the URL bar. This
          is the wide-screen column, where it makes no difference — but the
          drawer needs it, and a pair where only one of the two is right by luck
          is how the pair drifts. */}
      <aside className="sticky top-0 hidden h-dvh w-64 flex-shrink-0 lg:block print:hidden">{sidebar()}</aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="print:hidden sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-md lg:px-8">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label={t('nav.openMenu')}
            aria-expanded={isMenuOpen}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-ink-muted lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          {/* The brand on phones, where the sidebar that carries it is shut; the
              section name on wide screens, where it is always on view. */}
          <Link to="/dashboard" className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LogoIcon className="h-4 w-4" />
            </span>
            <span className="truncate font-display text-lg font-extrabold text-ink">{t('common.appName')}</span>
          </Link>
          {/* Chrome, not a title: small, quiet, and a `p`. Set as a heading it
              made two `h1`s per page (the E2E caught that: `getByRole('heading',
              { level: 1 })` stopped resolving to one element), and set in the
              display face at `text-xl` it competed with the page's own heading
              a few pixels below it — on /profissionais the two were the same
              word, twice, in the same weight. The reference this menu comes from
              does the same thing at the same volume: a small section name over
              the child and the date, under a much larger page title. */}
          <p className="hidden min-w-0 flex-1 truncate text-sm font-bold text-ink-muted lg:block">{sectionTitle}</p>

          {/* All three controls are 44x44, which is the AAA target size and also
              the only way this row is internally consistent: the two icon
              buttons were 32x32 from p-1.5 around a 20px icon while ThemeToggle
              beside them was 36x36. Nothing moves visually — the fills are
              transparent and the icons stay centred at their own size — so the
              growth is hit area only. */}
          <div className="flex flex-shrink-0 items-center gap-1">
            <ThemeToggle className="h-11 w-11" />
            <Link
              to="/notifications"
              className="relative flex h-11 w-11 items-center justify-center rounded-lg text-ink-muted"
            >
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              {/* The count is in the name, not only in the red circle: it is the
                  whole reason to look at a bell, and `aria-hidden` on the badge
                  is what stops it being announced as a bare number. */}
              <span className="sr-only">
                {unreadCount > 0
                  ? `${t('nav.notifications')}, ${t('notifications.unreadCount', { count: unreadCount })}`
                  : t('nav.notifications')}
              </span>
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-2.5 rounded-full p-1.5 transition-colors hover:bg-emerald-50/60 lg:pr-3 dark:hover:bg-emerald-950/40"
              title={t('profile.nav.viewProfile')}
            >
              {/* The account has no photo in the API — User is {id, email, name,
                  createdAt} — so the initial stands in, the same fallback a
                  child without a picture gets. A photo would be a column, a
                  route and an upload; the initial is the part of it a top bar
                  actually needs, which is to say whose session this is. */}
              <span
                aria-hidden="true"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                {accountInitial}
              </span>
              <span className="hidden max-w-[10rem] truncate text-[13px] font-bold text-ink lg:block">
                {accountLabel}
              </span>
              <span className="sr-only lg:hidden">{t('profile.nav.viewProfile')}</span>
            </Link>
          </div>
        </header>

        <div className="print:hidden">
          <OfflineBanner />
        </div>

        <main id="conteudo" tabIndex={-1} className="flex-1 p-5 md:p-10 lg:p-12 print:p-0">
          <Outlet />
        </main>
      </div>

      {/* The drawer, below `lg`. A Dialog rather than a hand-rolled panel: it
          brings the focus trap, Escape, the scroll lock and the click-outside
          that a menu covering the page needs, plus this repo's focus-restore fix
          for dialogs opened from state instead of from a DialogTrigger. */}
      <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="top-0 left-0 h-dvh w-[17rem] max-w-[85vw] translate-x-0 translate-y-0 gap-0 rounded-none p-0 ring-0 data-open:zoom-in-100 data-open:slide-in-from-left-4 data-closed:zoom-out-100 data-closed:slide-out-to-left-4"
        >
          <DialogTitle className="sr-only">{t('nav.sections')}</DialogTitle>
          {sidebar(() => setIsMenuOpen(false))}
        </DialogContent>
      </Dialog>

      <AddBabyDialog open={isAddBabyDialogOpen} onOpenChange={(open) => !open && closeAddBabyDialog()} />
    </div>
  )
}
