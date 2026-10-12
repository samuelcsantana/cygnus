import { useTranslation } from 'react-i18next'

import { useSmoothPending } from '@/hooks/useSmoothPending'
import { ServerIcon } from '@/shared/icons/server-icon'

/**
 * What a slow first request is really waiting for, said while it waits.
 *
 * The API runs on Render's free plan, which sleeps after fifteen idle minutes
 * and takes about a minute to come back. Until this existed, the first sign-in
 * of a quiet hour sat on "Entrando..." for that whole minute and looked broken,
 * which is the worst moment for it to: a visitor from a CV, trying the app
 * once.
 *
 * It appears only once the request has run 1.5s, so a warm server never shows
 * it. The bar fills over a minute, the length of the wait it describes; under
 * reduced motion it is simply full.
 *
 * The live region is rendered empty from the start and filled later, because a
 * region that appears together with its text is not reliably announced.
 */
export function ServerWakingNotice({ active }: { active: boolean }) {
  const { t } = useTranslation()
  const isVisible = useSmoothPending(active, { delay: 1500, minDuration: 0 })

  return (
    <div role="status">
      {isVisible && (
        <div className="mt-3 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-left dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <ServerIcon className="mt-0.5 size-[18px] shrink-0 text-emerald-700 dark:text-emerald-300" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink">{t('common.serverWaking.title')}</p>
            <p className="mt-0.5 text-[12.5px] leading-snug text-ink-muted">{t('common.serverWaking.body')}</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-primary/20">
              <div className="h-full animate-server-wake rounded-full bg-primary" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
