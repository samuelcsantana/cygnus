import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { AuthLayout } from '../components/AuthLayout'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterRoute() {
  const { t } = useTranslation()

  return (
    <AuthLayout>
      <div className="mb-10 text-center lg:text-left">
        <h2 className="text-3xl font-bold text-slate-900">{t('auth.register.title')}</h2>
        <p className="mt-2 text-slate-500">{t('auth.register.subtitle')}</p>
      </div>

      <RegisterForm />

      <p className="mt-8 text-center text-sm text-slate-500">
        {t('auth.register.hasAccount')}{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          {t('auth.register.loginLink')}
        </Link>
      </p>
    </AuthLayout>
  )
}
