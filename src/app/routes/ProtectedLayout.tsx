import { Navigate, Outlet } from 'react-router-dom'

import { useBabies } from '@/features/babies/api/babies.hooks'
import { ApiError } from '@/lib/http-client'

/**
 * There is no /auth/me endpoint, so GET /babies doubles as the session
 * probe: 401 means "not logged in" and redirects to /login.
 */
export function ProtectedLayout() {
  const babies = useBabies()

  if (babies.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-t-transparent h-8 w-8 animate-spin rounded-full border-2 border-primary" />
      </div>
    )
  }

  if (babies.isError) {
    if (babies.error instanceof ApiError && babies.error.status === 401) {
      return <Navigate to="/login" replace />
    }

    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center text-slate-500">
        {babies.error.message}
      </div>
    )
  }

  return <Outlet />
}
