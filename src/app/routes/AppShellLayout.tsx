import { SearchDestinationBanner } from '@/shared/components/SearchDestinationBanner'
import { useSearchDestinationStore } from '@/shared/stores/searchDestination.store'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useLogout } from '@/features/auth/api/auth.hooks'
import { useBabies } from '@/features/babies/api/babies.hooks'
import { AddBabyDialog } from '@/features/babies/components/AddBabyDialog'
import { useNotifications } from '@/features/notifications/api/notifications.hooks'
import { DashboardIcon } from '@/shared/icons/dashboard-icon'
import { GrowthIcon } from '@/shared/icons/growth-icon'
import { HeartIcon } from '@/shared/icons/heart-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'
import { UsersIcon } from '@/shared/icons/users-icon'
import { AppHeader } from '@/shared/components/AppHeader'
import { CloseIcon } from '@/shared/icons/close-icon'
import { AppSidebar } from '@/shared/components/AppSidebar'
import { OfflineBanner } from '@/shared/components/OfflineBanner'
import { useAddBabyDialogStore } from '@/shared/stores/addBabyDialog.store'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'

/**
 * Lazy, and mounted only after the first click, for the same reason every route
 * is: the dialog reaches into six features' hooks, and importing it eagerly
 * dragged their api modules and schemas into the entry chunk — 1.8 kB gzip that
 * every visitor paid on first paint for a panel most sessions never open.
 * Mounted-once rather than mounted-while-open so closing does not cut the
 * animation, and the chunk is fetched once.
 */
const SearchDialog = lazy(() =>
  import('@/features/search/components/SearchDialog').then((module) => ({
    default: module.SearchDialog,
  })),
)

export function AppShellLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const searchTarget = useSearchDestinationStore((state) => state.target)
  const searchRevision = useSearchDestinationStore((state) => state.revision)
  const activeSearchTarget = useRef(searchTarget)
  const babies = useBabies()
  const notifications = useNotifications()
  const identity = useAuthIdentityStore((state) => state.identity)
  const logout = useLogout()
  const isAddBabyDialogOpen = useAddBabyDialogStore((state) => state.isOpen)
  const openAddBabyDialog = useAddBabyDialogStore((state) => state.open)
  const closeAddBabyDialog = useAddBabyDialogStore((state) => state.close)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [wasSearchOpened, setWasSearchOpened] = useState(false)

  const openSearch = () => {
    setWasSearchOpened(true)
    setIsSearchOpen(true)
  }

  const babyList = babies.data ?? []
  const hasBabies = babyList.length > 0
  const selectedBabyId = useSelectedBabyStore((state) => state.selectedBabyId)
  const selectBaby = useSelectedBabyStore((state) => state.select)
  useEffect(() => {
    if (!searchTarget) {
      activeSearchTarget.current = null
      return
    }
    if (searchTarget.path === location.pathname && searchTarget.babyId === selectedBabyId) {
      activeSearchTarget.current = searchTarget
    } else if (activeSearchTarget.current === searchTarget) {
      useSearchDestinationStore.getState().set(null)
    }
  }, [location.pathname, selectedBabyId, searchTarget])
  useEffect(() => {
    if (!searchTarget || location.pathname !== searchTarget.path) return
    const frame = requestAnimationFrame(() => {
      const main = document.getElementById('conteudo')
      main?.scrollIntoView({ block: 'start' })
      main?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [location.pathname, searchTarget])
  useEffect(() => () => useSearchDestinationStore.getState().set(null), [])

  const reconcileSelectedBaby = useSelectedBabyStore((state) => state.reconcile)

  // The menu is the one place that holds the real list, so it is where a
  // selection pointing at a child who no longer exists gets dropped — otherwise
  // every list filters to nobody and the app looks empty for no visible reason.
  // Depends on `babies.data`, which TanStack keeps stable between renders, and
  // not on `babyList` — that one is a fresh array every render, so the effect
  // would run on every render for a check that only matters when the list itself
  // changes.
  useEffect(() => {
    if (babies.data) reconcileSelectedBaby(babies.data.map((baby) => baby.id))
  }, [babies.data, reconcileSelectedBaby])
  const unreadCount = notifications.data?.filter((n) => !n.readAt).length ?? 0

  // Notifications is not among them: it lives in the top bar as the bell, where
  // its unread count is readable from every page. Listing it here as well would
  // put two links to the same route on screen at once — a second thing to keep
  // in sync, and an ambiguous target for anyone navigating by name.
  const sections = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: <DashboardIcon className="h-5 w-5" /> },
    { to: '/vaccines', label: t('nav.vaccines'), icon: <SyringeIcon className="h-5 w-5" /> },
    {
      to: '/appointments',
      label: t('nav.appointments'),
      icon: <StethoscopeIcon className="h-5 w-5" />,
    },
    // Beside appointments, not at the end: a professional is who the appointment is with, and the
    // page is reached from the same intent.
    { to: '/profissionais', label: t('nav.specialists'), icon: <UsersIcon className="h-5 w-5" /> },
    { to: '/medications', label: t('nav.medications'), icon: <HeartIcon className="h-5 w-5" /> },
    { to: '/crescimento', label: t('nav.growth'), icon: <GrowthIcon className="h-5 w-5" /> },
    { to: '/milestones', label: t('nav.milestones'), icon: <SparkleIcon className="h-5 w-5" /> },
  ]

  const navItems = sections.map((item) => ({
    ...item,
    disabled: !hasBabies && !['/dashboard', '/profissionais'].includes(item.to),
  }))

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

  const sidebar = (onNavigate?: () => void) => (
    <AppSidebar
      items={navItems}
      showAccount={!!onNavigate}
      accountAvatarUrl={identity?.avatarUrl}
      accountName={accountLabel}
      accountEmail={identity?.email ?? ''}
      onAddBaby={() => {
        onNavigate?.()
        openAddBabyDialog()
      }}
      onLogout={handleLogout}
      logoutPending={logout.isPending}
      onNavigate={() => {
        useSearchDestinationStore.getState().set(null)
        onNavigate?.()
      }}
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
      <aside className="sticky top-0 hidden h-dvh w-64 flex-shrink-0 lg:block print:hidden">
        {sidebar()}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          menuOpen={isMenuOpen}
          onOpenMenu={() => setIsMenuOpen(true)}
          onSearch={openSearch}
          unreadCount={unreadCount}
          accountAvatarUrl={identity?.avatarUrl}
          accountName={accountLabel}
          accountEmail={identity?.email ?? ''}
          onLogout={handleLogout}
          logoutPending={logout.isPending}
          babies={babyList}
          selectedBabyId={selectedBabyId}
          onSelectBaby={selectBaby}
          loading={babies.isPending}
          error={babies.isError}
          onRetry={() => {
            void babies.refetch()
          }}
        />

        <div className="print:hidden">
          <OfflineBanner />
        </div>

        <main id="conteudo" tabIndex={-1} className="flex-1 p-5 md:p-10 lg:p-12 print:p-0">
          <SearchDestinationBanner />
          <Outlet key={searchTarget ? searchRevision : 'default'} />
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
          className="top-0 left-0 flex h-dvh w-[17rem] max-w-[85vw] flex-col overflow-hidden translate-x-0 translate-y-0 gap-0 rounded-none p-0 ring-0 data-open:zoom-in-100 data-open:slide-in-from-left-4 data-closed:zoom-out-100 data-closed:slide-out-to-left-4"
        >
          <DialogTitle className="sr-only">{t('nav.sections')}</DialogTitle>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            aria-label={t('nav.shell.closeMenu')}
            className="absolute right-2 top-3 z-10 flex size-11 items-center justify-center rounded-xl bg-card text-ink-muted hover:bg-muted"
          >
            <CloseIcon className="size-4" />
          </button>
          {sidebar(() => setIsMenuOpen(false))}
        </DialogContent>
      </Dialog>

      {wasSearchOpened && (
        <Suspense fallback={null}>
          <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
        </Suspense>
      )}

      <AddBabyDialog
        open={isAddBabyDialogOpen}
        onOpenChange={(open) => !open && closeAddBabyDialog()}
      />
    </div>
  )
}
