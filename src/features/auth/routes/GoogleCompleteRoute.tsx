import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'
import { getCurrentUser } from '../api/auth.api'
import { googleAuthQueryKeys } from '../api/google-auth.hooks'

export function GoogleCompleteRoute() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setIdentity = useAuthIdentityStore((state) => state.setIdentity)
  const error = params.get('error')
  // A fresh request confirms the session; neither URL parameters nor cached
  // identity from another account may authorize navigation into the app.
  const user = useQuery({ queryKey: googleAuthQueryKeys.complete, queryFn: getCurrentUser,
    enabled: !error, retry: false, staleTime: 0, gcTime: 0, meta: { expectsAnonymous: true } })
  useEffect(() => {
    if (!error && user.data) {
      setIdentity(user.data)
      void navigate('/dashboard', { replace: true })
    }
  }, [error, user.data, navigate, setIdentity])
  const failed = Boolean(error) || user.isError
  return <div className="space-y-4 py-7">
    <h1 className="font-display text-2xl font-bold text-ink">{t('auth.social.google')}</h1>
    <p role={failed ? 'alert' : 'status'} className="text-sm text-ink-muted">
      {t(failed ? error === 'email_verification_required' ? 'auth.social.googleVerifyEmail' : 'auth.social.googleError' : 'auth.social.googleCompleting')}
    </p>
    {failed && <Link to="/login" replace className="inline-block rounded font-semibold text-primary underline focus-visible:outline-2">{t('auth.social.googleBack')}</Link>}
  </div>
}
