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
      <Button asChild>
        <Link to="/">{t('errors.notFound.backHome')}</Link>
      </Button>
    </div>
  )
}
