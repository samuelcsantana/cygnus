import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
import { HeartIcon } from '@/shared/icons/heart-icon'
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
    { to: '/medications', label: t('nav.medications'), icon: <HeartIcon className="h-5 w-5" /> },
    { to: '/milestones', label: t('nav.milestones'), icon: <SparkleIcon className="h-5 w-5" /> },
    {
      to: '/notifications',
      label: t('nav.notifications'),
      icon: <BellIcon className="h-5 w-5" />,
      badge: unreadCount,
    },
  ]

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

  return (
    <div className="flex min-h-screen flex-col bg-surface">
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
      {/* `flex-wrap` no próprio cabeçalho, e não só na `<nav>` de dentro.
          Os três filhos do topo — logo, navegação e ações — não tinham para
          onde ir quando o texto crescia: o logo e as ações são
          `flex-shrink-0`, e a linha simplesmente estourava. Medido com o texto
          a 200% num viewport de 1280 (WCAG 1.4.4): quatro rotas ganhavam
          rolagem horizontal, e "Família Teste" e "Sair da conta" saíam da
          tela — perda de função, não de estética.

          A 100% nada se move: tudo cabe numa linha e o `wrap` nunca dispara. */}
      <header className="print:hidden sticky top-0 z-20 hidden flex-wrap items-center gap-6 border-b border-border bg-card/90 px-8 py-3 backdrop-blur-md md:flex">
        <Link to="/dashboard" className="flex flex-shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
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
            className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-dashed border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            {t('babies.addChild')}
          </button>
          <ThemeToggle />
          <Link
            to="/profile"
            className="flex items-center gap-2.5 rounded-full py-1.5 pr-3 pl-1.5 transition-colors hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40"
            title={t('profile.nav.viewProfile')}
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
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
            className="flex-shrink-0 rounded-lg p-2 text-ink-faint transition-colors hover:text-rose-500 dark:hover:text-rose-300 disabled:opacity-60"
          >
            <LogoutIcon className="h-4 w-4" />
          </button>
        </div>
      </header>

      <header className="print:hidden sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/80 px-5 py-4 backdrop-blur-md md:hidden">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LogoIcon className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-extrabold text-ink">{t('common.appName')}</span>
        </div>
        {/* All three controls are 44x44, which is the AAA target size and also
            the only way this row is internally consistent: the two icon
            buttons were 32x32 from p-1.5 around a 20px icon while ThemeToggle
            beside them was 36x36. Nothing moves visually — the fills are
            transparent and the icons stay centred at their own size — so the
            growth is hit area only. ThemeToggle takes the size through
            className rather than gaining a variant, since 44px is right here
            and not at its other call sites. */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openAddBabyDialog}
            aria-label={t('babies.addChild')}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-emerald-700 dark:text-emerald-300"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
          <ThemeToggle className="h-11 w-11" />
          <Link
            to="/profile"
            aria-label={t('profile.nav.viewProfile')}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-muted"
          >
            <UserIcon className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <div className="print:hidden">
        <OfflineBanner />
      </div>

      <main id="conteudo" tabIndex={-1} className="flex-1 p-5 pb-24 md:p-10 md:pb-10 lg:p-12 print:p-0">
        <Outlet />
      </main>

      <nav className="pb-safe print:hidden fixed right-0 bottom-0 left-0 z-30 flex justify-around border-t border-border bg-card/90 p-2 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] backdrop-blur-md md:hidden">
        {navItems.map((item) => (
          <MobileNavItem key={item.to} {...item} disabled={!hasBabies && item.to !== '/notifications'} />
        ))}
      </nav>

      <AddBabyDialog open={isAddBabyDialogOpen} onOpenChange={(open) => !open && closeAddBabyDialog()} />
    </div>
  )
}
