import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { RegisterForm } from '../components/RegisterForm'

export function RegisterRoute() {
  const { t } = useTranslation()

  return (
    <>
      <div className="mt-7 mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-balance text-ink">
          {t('auth.register.title')}
        </h1>
        <p className="mt-1.5 text-[13.5px] text-ink-muted">{t('auth.register.subtitle')}</p>
      </div>

      <RegisterForm />

      <p className="mt-6 text-center text-[13px] text-ink-muted">
        {t('auth.register.hasAccount')}{' '}
        <Link
          to="/login"
          className="rounded-sm font-semibold text-emerald-700 underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none dark:text-emerald-400"
        >
          {t('auth.register.loginLink')}
        </Link>
      </p>
    </>
  )
}
