import { useTranslation } from 'react-i18next'

interface DemoBannerProps {
  onCreateAccount: () => void
  onExit: () => void
  /** True while signing out, which both actions start with. */
  pending?: boolean
}

/**
 * The band at the top of every signed-in screen while the account is a demo.
 *
 * It says the one thing a visitor must not be left to guess: the family is
 * made up, and everything — including what they change — is deleted in 24
 * hours. It also offers the two ways out a visitor actually wants: a real
 * account, or leaving.
 */
export function DemoBanner({ onCreateAccount, onExit, pending = false }: DemoBannerProps) {
  const { t } = useTranslation()

  return (
    <section
      aria-label={t('demo.banner.label')}
      className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-b border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] text-ink dark:border-emerald-500/30 dark:bg-emerald-500/10 print:hidden"
    >
      <p className="min-w-0 flex-[1_1_16rem]">
        <strong className="font-bold text-emerald-800 dark:text-emerald-300">{t('demo.banner.title')}</strong>{' '}
        {t('demo.banner.body')}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={onCreateAccount}
          className="h-[34px] rounded-[9px] bg-auth-button px-3 text-[13px] font-semibold text-white transition-colors hover:bg-auth-button-hover focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none disabled:opacity-70"
        >
          {t('demo.banner.createAccount')}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onExit}
          className="h-[34px] rounded-[9px] border border-emerald-200 bg-card px-3 text-[13px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none disabled:opacity-70 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
        >
          {t('demo.banner.exit')}
        </button>
      </div>
    </section>
  )
}
