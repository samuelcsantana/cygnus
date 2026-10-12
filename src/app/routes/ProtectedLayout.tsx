import { Navigate, Outlet } from 'react-router-dom'

import { useSyncAuthIdentity } from '@/features/auth/api/auth.hooks'
import { NameGate } from '@/features/auth/components/NameGate'
import { LegalAcceptanceGate } from '@/features/legal/components/LegalAcceptanceGate'
import { ApiError } from '@/lib/http-client'

/**
 * GET /auth/me doubles as the session probe: 401 (after the http client's
 * own silent-refresh attempt already failed) means "not logged in" and
 * redirects to /login. Also hydrates authIdentity.store with the confirmed
 * profile — see useSyncAuthIdentity.
 */
export function ProtectedLayout() {
  const currentUser = useSyncAuthIdentity()

  if (currentUser.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-t-transparent h-8 w-8 animate-spin rounded-full border-2 border-primary" />
      </div>
    )
  }

  if (currentUser.isError) {
    if (currentUser.error instanceof ApiError && currentUser.error.status === 401) {
      return <Navigate to="/login" replace />
    }

    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center text-ink-muted">
        {currentUser.error.message}
      </div>
    )
  }

  const content = (
    // The name gate is inert for every account that has one, which today is
    // all of them — see NameGate.
    <NameGate>
      <Outlet />
    </NameGate>
  )

  // A demo account is not asked to accept the privacy policy and terms (decided
  // 2026-10-12). Nobody signed up: the account is a sample family, made by one
  // click and deleted in 24 hours, and a consent screen between the visitor and
  // the product is the one thing the demo exists to remove. No acceptance is
  // recorded on its behalf either — a consent record for a text nobody read
  // would be a false record. The API says which accounts these are.
  if (currentUser.data.demoExpiresAt) {
    return content
  }

  // Inside the session gate and outside everything else: consent is asked of a
  // known person, and it has to be asked before any screen that shows a child's
  // data. Consent outermost: whether we may process this person's data is
  // settled before we ask them anything else.
  return <LegalAcceptanceGate>{content}</LegalAcceptanceGate>

}
