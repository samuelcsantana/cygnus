import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { LogoIcon } from '@/shared/icons/logo-icon'

/**
 * Sits outside ProtectedLayout (it's the router's top-level catch-all, see
 * router.tsx), so it can't assume a session either way — the "back home"
 * link just goes to "/", which resolves to /dashboard or /login on its own.
 */
export function NotFoundRoute() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="bg-primary/10 text-primary mb-2 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
        <LogoIcon className="h-8 w-8" />
      </div>
      <p className="text-primary text-sm font-semibold tracking-wider uppercase">{t('errors.notFound.eyebrow')}</p>
      <h1 className="text-2xl font-bold text-ink">{t('errors.notFound.title')}</h1>
      <p className="max-w-md text-ink-muted">{t('errors.notFound.description')}</p>
      {/* h-12 and a real width, not the raw Button default. This screen has no
          app shell — it is the router's top-level catch-all, so there is no nav
          and no header — which makes this link the only way out. At 117x32 it
          was the same size the invite CTA had before it was fixed, and for the
          same reason: a screen whose whole purpose is one action was drawing
          that action smaller than any form submit in the app. */}
      <Button asChild className="mt-2 h-12 w-full max-w-xs text-[15px] font-semibold">
        <Link to="/">{t('errors.notFound.backHome')}</Link>
      </Button>
    </div>
  )
}
