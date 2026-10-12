import { useTranslation } from 'react-i18next'

import { ExternalLinkIcon } from '@/shared/icons/external-link-icon'
import { DESIGN_SYSTEM_URL, SOURCE_URL } from '@/shared/portfolio-links'

/**
 * A thin band above the public screens saying what this is: a portfolio
 * project, with the code and the design system one click away.
 *
 * Without it the app pretends to be a product someone runs, and the person it
 * is actually for — reading a CV — has to find the repository on their own. It
 * sits only on the public screens; once signed in, the app is the point.
 *
 * An `aside` with a name, so its links live in a landmark like everything else
 * on the page (axe's `region` rule) and a screen reader can skip it.
 */
export function PortfolioStrip() {
  const { t } = useTranslation()
  return (
    <aside aria-label={t('landing.strip.regionLabel')} className="bg-auth-panel text-[12.5px] text-emerald-100">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 md:px-6">
        <p>
          <span className="font-semibold text-white">{t('landing.strip.label')}</span> {t('landing.strip.author')}
          <span className="hidden md:inline"> · {t('landing.strip.stack')}</span>
        </p>
        <p className="flex gap-3.5">
          <StripLink href={SOURCE_URL}>{t('landing.strip.code')}</StripLink>
          <StripLink href={DESIGN_SYSTEM_URL}>{t('landing.strip.designSystem')}</StripLink>
        </p>
      </div>
    </aside>
  )
}

function StripLink({ href, children }: { href: string; children: string }) {
  const { t } = useTranslation()
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-sm font-semibold text-white underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none"
    >
      {children}
      <ExternalLinkIcon className="size-3.5" />
      <span className="sr-only"> {t('landing.newTab')}</span>
    </a>
  )
}
