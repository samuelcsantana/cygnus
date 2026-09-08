import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/lib/http-client'
import { GoogleIcon } from '@/shared/icons/google-icon'
import { startGoogleSignIn } from '../api/google-auth.api'
import { useGoogleStatus } from '../api/google-auth.hooks'

const redirect = (url: string) => window.location.assign(url)

export function GoogleSignInButton({ onRedirect = redirect }: { onRedirect?: (url: string) => void }) {
  const { t } = useTranslation()
  const status = useGoogleStatus()
  const start = useMutation({ mutationFn: startGoogleSignIn, onSuccess: (url) => onRedirect(url) })
  const pending = start.isPending || start.isSuccess
  return (
    <div className="space-y-2">
      <button type="button" disabled={!status.data?.enabled || pending} onClick={() => start.mutate()}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-[10px] border border-border bg-card text-sm font-medium text-ink transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60">
        <GoogleIcon className="h-[18px] w-[18px]" />
        {t(pending ? 'auth.social.googleRedirecting' : 'auth.social.google')}
      </button>
      {status.isError ? (
        <p className="text-center text-xs text-ink-muted" role="status">
          {t('auth.social.googleUnavailable')}{' '}
          <button type="button" onClick={() => void status.refetch()} className="rounded underline focus-visible:outline-2">{t('auth.social.googleRetry')}</button>
        </p>
      ) : status.data && !status.data.enabled ? (
        <p className="text-center text-xs text-ink-muted">{t('auth.social.googleUnavailable')}</p>
      ) : null}
      {start.isError && <p role="alert" className="text-center text-sm text-destructive">
        {t(start.error instanceof ApiError && start.error.status === 429 ? 'auth.assisted.rateLimited' : 'auth.social.googleError')}
      </p>}
    </div>
  )
}
