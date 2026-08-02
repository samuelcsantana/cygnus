import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { queryClient } from '@/lib/query-client'

import { AuthLayout } from '../components/AuthLayout'
import { LoginForm } from '../components/LoginForm'

export function LoginRoute() {
  const { t } = useTranslation()

  useEffect(() => {
    // The login screen only ever mounts once the protected shell (and its
    // useCurrentUser()/useBabies() observers) has unmounted, so this can
    // never leak a previous session's data into a stale still-mounted query.
    queryClient.clear()
  }, [])

  return (
    <AuthLayout>
      <div className="mb-10 text-center lg:text-left">
        <h2 className="font-display text-3xl font-extrabold text-ink">{t('auth.login.title')}</h2>
        <p className="mt-2 text-ink-muted">{t('auth.login.subtitle')}</p>
      </div>

      <LoginForm />

      <p className="mt-8 text-center text-sm text-ink-muted">
        {t('auth.login.noAccount')}{' '}
        <Link to="/register" className="text-primary font-semibold hover:underline">
          {t('auth.login.registerLink')}
        </Link>
      </p>
    </AuthLayout>
  )
}
