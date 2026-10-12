import type { ComponentType, CSSProperties, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { BrandSignature } from '@/shared/components/BrandSignature'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { PortfolioStrip } from '@/shared/components/PortfolioStrip'
import { ProductPreviewCard } from '@/shared/components/ProductPreviewCard'
import { ThemeToggle } from '@/shared/components/ThemeToggle'
import { BookIcon } from '@/shared/icons/book-icon'
import { CheckIcon } from '@/shared/icons/check-icon'
import { CodeIcon } from '@/shared/icons/code-icon'
import type { IconProps } from '@/shared/icons/icon-base'
import { GrowthIcon } from '@/shared/icons/growth-icon'
import { PillIcon } from '@/shared/icons/pill-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'
import { UsersIcon } from '@/shared/icons/users-icon'
import { API_SOURCE_URL, DESIGN_SYSTEM_URL, SOURCE_URL } from '@/shared/portfolio-links'

import { ScheduleWidgetShowcase } from './ScheduleWidgetShowcase'
import './landing.css'

const CONTAINER = 'mx-auto w-full max-w-6xl px-5 md:px-8'
const EYEBROW = 'mb-3.5 text-xs font-semibold tracking-[0.1em] text-auth-action uppercase'
const SECTION_TITLE = 'font-display text-[30px] leading-[1.15] font-medium tracking-[-0.025em] text-balance text-ink md:text-4xl'
const PRIMARY_ACTION =
  'inline-flex h-12 items-center justify-center rounded-xl bg-auth-button px-[22px] text-[15px] font-semibold text-white transition-colors hover:bg-auth-button-hover focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none'
const SECONDARY_ACTION =
  'inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-[22px] text-[15px] font-semibold text-ink transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none'

// The code a host pastes, shown as code: not translated, and kept in step with
// embed/README.md by hand because a page is not a place to import a contract from.
const EMBED_SNIPPET_LINES = [
  ['<div', ' id=', '"vacinas"', '></div>'],
  ['<script', ' src=', '"https://cygnus.samuelsantana.dev/embed/embed.js"', ''],
  ['       ', ' data-target=', '"#vacinas"', ' defer></script>'],
] as const

interface Feature {
  key: 'vaccines' | 'appointments' | 'growth' | 'milestones' | 'medications' | 'family'
  Icon: ComponentType<IconProps>
  tone: string
}

// Each area keeps the colour it has inside the app, so the page introduces the
// map the product uses rather than a palette of its own.
const FEATURES: Feature[] = [
  { key: 'vaccines', Icon: SyringeIcon, tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  { key: 'appointments', Icon: StethoscopeIcon, tone: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200' },
  { key: 'growth', Icon: GrowthIcon, tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  { key: 'milestones', Icon: SparkleIcon, tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  { key: 'medications', Icon: PillIcon, tone: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
  { key: 'family', Icon: UsersIcon, tone: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200' },
]

const INSIDE_ITEMS = ['a11y', 'contract', 'session', 'widget'] as const

interface LandingPageProps {
  /** Passed through to the widget; stories pass `null` (see ScheduleWidgetShowcase). */
  widgetScriptSrc?: string | null
}

/**
 * What `/` shows a visitor with no session: the product, before any form.
 *
 * Until this page, the CV's link opened straight onto a login screen and
 * nothing of the app was visible without an account. The page shows it four
 * ways, in the order a stranger needs them: what it is (the hero, with a still
 * of the vaccine card), the one part anyone can use without signing up (the
 * public widget, running for real), what else it does, and — because the
 * audience is often a recruiter — how it is built, with the code one click
 * away.
 *
 * Every claim under "Por dentro" is something the repositories enforce and a
 * reader can check; none is a count, because counts drift and nothing would
 * update this page when they do.
 */
export function LandingPage({ widgetScriptSrc }: LandingPageProps) {
  const { t } = useTranslation()

  return (
    <div className="landing flex min-h-dvh flex-col bg-auth-surface">
      <PortfolioStrip />

      {/* Sticky and settled by default; landing.css makes it transparent at the
          top and settle as the page scrolls, where the browser supports that. */}
      <header className="landing-header sticky top-0 z-20 border-b border-border/70 bg-auth-surface/85 shadow-[0_10px_28px_-18px_rgba(26,46,37,0.45)] backdrop-blur-[10px]">
        <div className={cn(CONTAINER, 'flex h-[72px] items-center gap-3')}>
          <Link
            to="/"
            aria-label={t('landing.nav.home')}
            className="rounded-lg focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none"
          >
            <BrandSignature compact />
          </Link>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link
              to="/login"
              className="ml-1 hidden h-10 items-center rounded-[10px] px-3.5 text-sm font-semibold text-ink transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none sm:inline-flex"
            >
              {t('landing.nav.signIn')}
            </Link>
            {/* Off below 480px: the header would not hold it beside the brand
                and both controls, and the hero repeats it a few pixels lower. */}
            <Link
              to="/register"
              className="hidden h-10 items-center rounded-[10px] bg-auth-button px-4 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-auth-button-hover focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none min-[480px]:inline-flex"
            >
              {t('landing.nav.createAccount')}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className={cn(CONTAINER, 'grid gap-10 pt-10 pb-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-14 lg:pt-[72px] lg:pb-[88px]')}>
          <div>
            <p className={EYEBROW}>{t('landing.hero.eyebrow')}</p>
            <h1 className="font-display text-[38px] leading-[1.08] font-medium tracking-[-0.03em] text-balance text-ink md:text-[52px]">
              {t('landing.hero.titleLead')} <em className="text-auth-action">{t('landing.hero.titleEmphasis')}</em>
            </h1>
            <p className="mt-5 max-w-[34rem] text-base leading-relaxed text-ink-muted">{t('landing.hero.subtitle')}</p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link to="/register" className={PRIMARY_ACTION}>
                {t('landing.hero.createAccount')}
              </Link>
              <Link to="/login" className={SECONDARY_ACTION}>
                {t('landing.hero.signIn')}
              </Link>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[12.5px] text-ink-muted">
              <CheckIcon className="size-3.5 shrink-0 text-auth-action" />
              {t('landing.hero.trust')}
            </p>
          </div>
          <div className="flex justify-center pt-3">
            <ProductPreviewCard />
          </div>
        </section>

        <Section id="calendario" labelledBy="landing-schedule-title">
          <div data-reveal className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
            {/* min-w-0: a grid item will not shrink below its content, and the
                snippet's longest line is wider than a phone. Without it the
                whole column grew to 490px at 360px and the page scrolled
                sideways; with it, only the snippet scrolls. */}
            <div className="min-w-0">
              <p className={EYEBROW}>{t('landing.schedule.eyebrow')}</p>
              <h2 id="landing-schedule-title" className={SECTION_TITLE}>
                {t('landing.schedule.title')}
              </h2>
              <p className="mt-3.5 max-w-[34rem] text-[15px] leading-relaxed text-ink-muted">{t('landing.schedule.body')}</p>
              {/* A named, focusable region because it scrolls sideways on a
                  phone: a region that scrolls has to be reachable without a
                  mouse, and a tab stop has to say what it is. A bare <pre> is
                  `generic`, where aria-label is prohibited. */}
              <pre
                role="region"
                tabIndex={0}
                aria-label={t('landing.schedule.codeLabel')}
                className="mt-5 overflow-x-auto rounded-xl bg-slate-900 px-4 py-3.5 font-mono text-[12.5px] leading-relaxed text-slate-100 focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none"
              >
                <code>
                  {EMBED_SNIPPET_LINES.map(([tag, attribute, value, rest], index) => (
                    <span key={index} className="block">
                      <span className="text-emerald-300">{tag}</span>
                      {attribute}
                      <span className="text-amber-300">{value}</span>
                      <span className="text-emerald-300">{rest}</span>
                    </span>
                  ))}
                </code>
              </pre>
              <p className="mt-2.5 text-[12.5px] text-ink-muted">{t('landing.schedule.note')}</p>
            </div>
            <div className="w-full max-w-[26.5rem] justify-self-center lg:justify-self-end">
              <ScheduleWidgetShowcase scriptSrc={widgetScriptSrc} />
            </div>
          </div>
        </Section>

        <Section labelledBy="landing-features-title">
          <div data-reveal>
            <p className={EYEBROW}>{t('landing.features.eyebrow')}</p>
            <h2 id="landing-features-title" className={SECTION_TITLE}>
              {t('landing.features.title')}
            </h2>
          </div>
          <ul className="mt-8 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ key, Icon, tone }, index) => (
              <li
                key={key}
                data-reveal
                data-reveal-column
                // Its column on the three-wide grid, so the cascade runs left to right.
                style={{ '--column': index % 3 } as CSSProperties}
                className="rounded-2xl border border-border bg-card p-[18px]"
              >
                <span className={cn('mb-3 flex size-9 items-center justify-center rounded-xl', tone)}>
                  <Icon className="size-[18px]" />
                </span>
                <h3 className="font-display text-[17px] font-medium text-ink">{t(`landing.features.${key}Title`)}</h3>
                <p className="mt-1 text-[13.5px] leading-normal text-ink-muted">{t(`landing.features.${key}Body`)}</p>
              </li>
            ))}
          </ul>
        </Section>

        <section aria-labelledby="landing-inside-title" className="bg-auth-panel text-emerald-50">
          <div data-reveal className={cn(CONTAINER, 'py-12 md:py-[72px]')}>
            <p className="mb-3.5 text-xs font-semibold tracking-[0.1em] text-emerald-300 uppercase">{t('landing.inside.eyebrow')}</p>
            <h2
              id="landing-inside-title"
              className="font-display text-[30px] leading-[1.15] font-medium tracking-[-0.025em] text-balance text-white md:text-4xl"
            >
              {t('landing.inside.title')}
            </h2>
            <ul className="mt-7 grid gap-3.5 md:grid-cols-2">
              {INSIDE_ITEMS.map((key) => (
                <li key={key} className="rounded-[14px] border border-white/12 bg-white/[0.04] px-[18px] py-4">
                  <h3 className="text-sm font-semibold text-white">{t(`landing.inside.${key}Title`)}</h3>
                  <p className="mt-1 text-[13px] leading-normal text-emerald-100">{t(`landing.inside.${key}Body`)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <InsideLink href={SOURCE_URL} icon={<CodeIcon className="size-4" />}>
                {t('landing.inside.appCode')}
              </InsideLink>
              <InsideLink href={API_SOURCE_URL} icon={<CodeIcon className="size-4" />}>
                {t('landing.inside.apiCode')}
              </InsideLink>
              <InsideLink href={DESIGN_SYSTEM_URL} icon={<BookIcon className="size-4" />}>
                {t('landing.inside.designSystem')}
              </InsideLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-4 pt-7 pb-8 text-center text-xs leading-5 text-ink-muted">
        <p>
          <span className="block sm:inline">{t('auth.brand.copyright', { year: new Date().getFullYear() })}</span>
          <span aria-hidden="true" className="hidden sm:inline">
            {' · '}
          </span>
          <span className="block sm:inline">{t('auth.brand.footerNote')}</span>
        </p>
        <p>
          <Link to="/privacidade" className="underline-offset-4 hover:underline">
            {t('legal.footerPrivacy')}
          </Link>
          {' · '}
          <Link to="/termos" className="underline-offset-4 hover:underline">
            {t('legal.footerTerms')}
          </Link>
        </p>
      </footer>
    </div>
  )
}

function Section({ id, labelledBy, children }: { id?: string; labelledBy: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className="border-t border-border/70">
      <div className={cn(CONTAINER, 'py-12 md:py-[72px]')}>{children}</div>
    </section>
  )
}

function InsideLink({ href, icon, children }: { href: string; icon: ReactNode; children: string }) {
  const { t } = useTranslation()
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-white/25 px-3.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-emerald-300 focus-visible:outline-none"
    >
      {icon}
      {children}
      <span className="sr-only"> {t('landing.newTab')}</span>
    </a>
  )
}
