import { Navigate, Outlet } from 'react-router-dom'

import { useSyncAuthIdentity } from '@/features/auth/api/auth.hooks'
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

  // Inside the session gate and outside everything else: consent is asked of a
  // known person, and it has to be asked before any screen that shows a child's
  // data. Inert while both documents are drafts — see LegalAcceptanceGate.
  return (
    <LegalAcceptanceGate>
      <Outlet />
    </LegalAcceptanceGate>
  )
}
