import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { queryClient } from '@/lib/query-client'

import type { AssistedMode } from '../api/auth.hooks'
import { AuthAssistedFlow } from '../components/AuthAssistedFlow'
import { LoginForm } from '../components/LoginForm'

export function LoginRoute() {
  const { t } = useTranslation()
  // The e-mail is held here rather than in either child so it survives the swap
  // in both directions: typed on the login form it seeds the flow, and typed in
  // the flow it comes back to the login form instead of being lost.
  const [email, setEmail] = useState('')
  const [assistedMode, setAssistedMode] = useState<AssistedMode | null>(null)

  useEffect(() => {
    // The login screen only ever mounts once the protected shell (and its
    // useCurrentUser()/useBabies() observers) has unmounted, so this can
    // never leak a previous session's data into a stale still-mounted query.
    queryClient.clear()
  }, [])

  if (assistedMode) {
    return (
      <AuthAssistedFlow
        mode={assistedMode}
        initialEmail={email}
        onExit={(returnedEmail) => {
          setEmail(returnedEmail)
          setAssistedMode(null)
        }}
      />
    )
  }

  return (
    <>
      {/* The screen title is the document's <h1> at every breakpoint — the
          brand headline in the desktop panel is decorative copy, and making it
          the h1 left mobile with no first-level heading at all. */}
      <div className="mt-7 mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-balance text-ink">
          {t('auth.login.title')}
        </h1>
        <p className="mt-1.5 text-[13.5px] text-ink-muted">{t('auth.login.subtitle')}</p>
      </div>

      <LoginForm
        defaultEmail={email}
        onStartAssisted={(mode, typedEmail) => {
          setEmail(typedEmail)
          setAssistedMode(mode)
        }}
      />

      <p className="mt-6 text-center text-[13px] text-ink-muted">
        {t('auth.login.noAccount')}{' '}
        <Link
          to="/register"
          className="rounded-sm font-semibold text-emerald-700 underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none dark:text-emerald-400"
        >
          {t('auth.login.registerLink')}
        </Link>
      </p>
    </>
  )
}
