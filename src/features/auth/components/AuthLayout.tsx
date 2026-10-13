import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router-dom'
import authHeroUrl from '@/assets/auth-hero.avif'
import { useWakeApi } from '@/hooks/useWakeApi'
import { BrandSignature } from '@/shared/components/BrandSignature'
import { PortfolioStrip } from '@/shared/components/PortfolioStrip'
import { ProductPreviewCard } from '@/shared/components/ProductPreviewCard'
import { PublicHeaderBar } from '@/shared/components/PublicHeaderBar'
import { CheckIcon } from '@/shared/icons/check-icon'
import { AuthBackdrop } from './AuthBackdrop'

/** Shared across auth routes so the brand panel stays mounted during navigation. */
export function AuthLayout() {
  const { t } = useTranslation()
  useWakeApi()
  return (
    <div className="relative flex min-h-dvh flex-col bg-auth-surface">
      <AuthBackdrop />
      <div className="relative z-10"><PortfolioStrip /></div>
      {/* The landing page's header row, so "Entrar" changes the page under it
          and nothing in it. This screen had its own full-width row, and the
          theme and language buttons jumped right and down on the way in: 384px
          and 14px on a 1920px screen. The mark also links back home now. */}
      <header className="relative z-10"><PublicHeaderBar /></header>
      <div className="relative z-10 flex flex-1 flex-col px-4 pb-6 sm:px-6 lg:px-8">
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
              {/* A piece of the product instead of three bullet points about it.
                  The template look of a sign-in screen came from exactly that
                  composition — green panel, photo, three features — and the
                  panel now shows what it used to describe. */}
              <div className="relative z-10 mt-8 mb-8 flex justify-center">
                <ProductPreviewCard animated />
              </div>
              <p className="relative z-10 mt-auto flex items-center gap-2 border-t border-white/15 pt-6 text-xs text-emerald-50">
                <CheckIcon className="size-3.5 shrink-0" />{t('auth.brand.trust')}
              </p>
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-12">
              <div className="w-full">
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
