import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router-dom'
import authHeroUrl from '@/assets/auth-hero.avif'
import { BrandSignature } from '@/shared/components/BrandSignature'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { ThemeToggle } from '@/shared/components/ThemeToggle'
import { BellIcon } from '@/shared/icons/bell-icon'
import { CalendarIcon } from '@/shared/icons/calendar-icon'
import { CheckIcon } from '@/shared/icons/check-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'
import { AuthBackdrop } from './AuthBackdrop'

const FEATURES = [
  { Icon: CalendarIcon, title: 'auth.brand.featureVaccinesTitle', hint: 'auth.brand.featureVaccinesHint' },
  { Icon: SparkleIcon, title: 'auth.brand.featureMilestonesTitle', hint: 'auth.brand.featureMilestonesHint' },
  { Icon: BellIcon, title: 'auth.brand.featureAlertsTitle', hint: 'auth.brand.featureAlertsHint' },
] as const

/** Shared across auth routes so the brand panel stays mounted during navigation. */
export function AuthLayout() {
  const { t } = useTranslation()
  return (
    <div className="relative flex min-h-dvh flex-col bg-auth-surface">
      <AuthBackdrop />
      <div className="relative z-10 flex flex-1 flex-col px-4 pb-6 pt-4 sm:px-6 lg:px-8 lg:pt-8">
        <header className="flex items-center justify-end gap-1.5">
          <ThemeToggle />
          <LanguageSwitcher />
        </header>
        <main className="flex flex-1 items-start justify-center py-5 sm:items-center sm:py-8">
          <div className="grid w-full max-w-[26rem] grid-cols-1 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xl shadow-emerald-900/5 lg:min-h-[40rem] lg:max-w-[56rem] lg:grid-cols-[11fr_14fr] dark:shadow-black/20">
            <div className="relative isolate hidden flex-col overflow-hidden bg-gradient-to-br from-auth-panel to-auth-button p-10 lg:flex">
              {/* Low image opacity bounds the lightest background under white copy. */}
              <img src={authHeroUrl} alt="" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-10" />
              <div className="relative z-10"><BrandSignature inverse /></div>
              <div className="relative z-10 mt-12">
                <p className="font-display text-[42px] font-normal leading-[1.12] tracking-tight text-white">
                  {t('auth.brand.headlineLead')}<br /><em>{t('auth.brand.headlineEmphasis')}</em></p>
                <p className="mt-4 max-w-[19rem] text-sm leading-relaxed text-emerald-50">{t('auth.brand.tagline')}</p>
              </div>
              <ul className="relative z-10 mb-8 mt-8 flex flex-col gap-4">
                {FEATURES.map(({ Icon, title, hint }) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="mt-px flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-white ring-1 ring-white/15"><Icon className="size-4" /></span>
                    <span className="flex flex-col">
                      <span className="text-[13px] font-semibold leading-5 text-white">{t(title)}</span>
                      <span className="text-xs leading-4 text-emerald-50">{t(hint)}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="relative z-10 mt-auto flex items-center gap-2 border-t border-white/15 pt-6 text-xs text-emerald-50">
                <CheckIcon className="size-3.5 shrink-0" />{t('auth.brand.trust')}
              </p>
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-12">
              <div className="w-full">
                <div className="mb-6 lg:hidden"><BrandSignature /></div>
                <Outlet />
              </div>
            </div>
          </div>
        </main>
        <footer className="text-center text-xs leading-5 text-ink-muted">
          <p>
            <span className="block sm:inline">{t('auth.brand.copyright', { year: new Date().getFullYear() })}</span>
            <span aria-hidden="true" className="hidden sm:inline">{' · '}</span>
            <span className="block sm:inline">{t('auth.brand.footerNote')}</span>
          </p>
          <p>
            <Link to="/privacidade" className="underline-offset-4 hover:underline">{t('legal.footerPrivacy')}</Link>
            {' · '}
            <Link to="/termos" className="underline-offset-4 hover:underline">{t('legal.footerTerms')}</Link>
          </p>
        </footer>
      </div>
    </div>
  )
}
