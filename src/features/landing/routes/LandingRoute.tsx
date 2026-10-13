import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

import { useCurrentUser } from '@/features/auth/api/auth.hooks'
import { useWakeApi } from '@/hooks/useWakeApi'
import { readCookie } from '@/lib/cookies'

import { LandingPage } from '../components/LandingPage'

// The double-submit cookie: readable by JS on purpose, set with every session
// and cleared at logout, and it lives exactly as long as the refresh token.
const SESSION_HINT_COOKIE = 'csrf_token'

/**
 * `/` — the landing page for a visitor, the dashboard for someone signed in.
 *
 * **No request at all for the visitor.** Whether a session exists cannot be
 * read from JS (the tokens are HttpOnly), and asking the API would hold this
 * page for as long as the free Render instance takes to wake — about a minute,
 * on exactly the visit that matters most, someone following the CV's link. The
 * CSRF cookie is the hint instead: without it there is no session to find, and
 * the page renders at once.
 *
 * With it, `/auth/me` decides: signed in goes to the dashboard, as `/` always
 * did; a 401 (the http client's silent refresh already tried) shows the page.
 * `expectsAnonymous` keeps that 401 from tripping the global "session expired"
 * redirect to /login.
 *
 * A demo session sees the page too. The demo starts here, and a visitor who
 * presses the browser's back button from inside it expects to come back here;
 * redirected to the dashboard, the button looked broken. The page's demo
 * buttons then return to the running demo instead of starting another.
 */
export function LandingRoute() {
  const [hasSessionHint] = useState(() => readCookie(SESSION_HINT_COOKIE) !== null)

  return hasSessionHint ? <SessionAwareLanding /> : <VisitorLanding />
}

function VisitorLanding() {
  // Nothing on this page needs the API, but the demo button and sign-in will,
  // so the sleeping instance starts waking while the visitor reads.
  useWakeApi()
  return <LandingPage />
}

function SessionAwareLanding() {
  const { t } = useTranslation()
  const currentUser = useCurrentUser({ expectsAnonymous: true })

  if (currentUser.isSuccess) {
    if (currentUser.data.demoExpiresAt) return <LandingPage demoActive />
    return <Navigate to="/dashboard" replace />
  }

  if (currentUser.isPending) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center bg-auth-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    )
  }

  return <LandingPage />
}
