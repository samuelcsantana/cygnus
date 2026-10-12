import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { ServerWakingNotice } from '@/shared/components/ServerWakingNotice'
import { PlayIcon } from '@/shared/icons/play-icon'
import { SpinnerIcon } from '@/shared/icons/spinner-icon'

import { demoStartErrorKey, useStartDemoSession } from '../api/auth.hooks'

/**
 * The way in without an account, above the sign-in form.
 *
 * Most people who reach this screen from the CV have no account and will not
 * make one to look around, so the demo comes first and the form second, with
 * a divider saying so. The account behind it is disposable — a sample family,
 * deleted in 24 hours (API: POST /auth/demo).
 */
export function DemoEntry() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const demo = useStartDemoSession()

  return (
    <div className="mb-5">
      <button
        type="button"
        disabled={demo.isPending}
        aria-busy={demo.isPending}
        onClick={() =>
          demo.mutate(undefined, {
            onSuccess: () => navigate('/dashboard', { replace: true }),
            onError: (error) => toast.error(t(demoStartErrorKey(error))),
          })
        }
        className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[10px] border-[1.5px] border-auth-button bg-emerald-50/70 text-[15px] font-semibold text-auth-action transition-colors hover:bg-emerald-100/70 focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none dark:border-emerald-400/60 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15"
      >
        {demo.isPending ? (
          <>
            <SpinnerIcon className="size-4 animate-spin" />
            {t('demo.opening')}
          </>
        ) : (
          <>
            <PlayIcon className="size-4" />
            {t('demo.start')}
            <span className="text-[12.5px] font-medium text-ink-muted">{t('demo.noSignUp')}</span>
          </>
        )}
      </button>
      <ServerWakingNotice active={demo.isPending} />
      <p className="mt-2 text-center text-xs text-ink-muted">{t('demo.note')}</p>
      <div className="mt-5 flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-ink-faint">{t('demo.orSignIn')}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  )
}
