import { Navigate, Outlet } from 'react-router-dom'

import { useSyncAuthIdentity } from '@/features/auth/api/auth.hooks'
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
      <div className="flex min-h-screen items-center justify-center p-8 text-center text-slate-500">
        {currentUser.error.message}
      </div>
    )
  }

  return <Outlet />
}
