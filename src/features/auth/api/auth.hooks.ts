import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { ApiError } from '@/lib/http-client'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  requestPasswordResetCode,
  requestPasswordlessCode,
  startDemoSession,
  verifyPasswordReset,
  verifyPasswordlessCode,
} from './auth.api'
import type {
  AssistedRequestInput,
  LoginInput,
  PasswordResetVerifyInput,
  RegisterInput,
} from './auth.schemas'

/** Which assisted flow the user picked on the login screen. */
export type AssistedMode = 'passwordless' | 'reset'

export const currentUserQueryKey = ['auth', 'me'] as const

interface CurrentUserOptions {
  /**
   * Set on a **public** route that asks who is signed in without requiring it.
   * A 401 then means "nobody", not "your session expired", so the global
   * unauthorized handler is skipped and the visitor stays where they are.
   *
   * The protected shell must leave this off: there a 401 really is expiry, and
   * the redirect to /login is the correct answer.
   */
  expectsAnonymous?: boolean
}

export function useCurrentUser({ expectsAnonymous = false }: CurrentUserOptions = {}) {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    staleTime: 5 * 60_000,
    meta: { expectsAnonymous },
  })
}

/**
 * Keeps authIdentity.store in sync with the confirmed GET /auth/me profile.
 * Mounted once by ProtectedLayout so the real name survives a page refresh
 * instead of falling back to the raw email (see authIdentity.store.ts).
 */
export function useSyncAuthIdentity() {
  const setIdentity = useAuthIdentityStore((state) => state.setIdentity)
  const currentUser = useCurrentUser()

  useEffect(() => {
    if (currentUser.data) {
      setIdentity({
        id: currentUser.data.id,
        email: currentUser.data.email,
        name: currentUser.data.name,
        avatarUrl: currentUser.data.avatarUrl,
      })
    }
  }, [currentUser.data, setIdentity])

  return currentUser
}

export function useRegister() {
  const setIdentity = useAuthIdentityStore((state) => state.setIdentity)

  return useMutation({
    mutationFn: (input: RegisterInput) => registerUser(input),
    onSuccess: (user) => {
      setIdentity({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl })
    },
  })
}

export function useLogin() {
  const setIdentity = useAuthIdentityStore((state) => state.setIdentity)

  return useMutation({
    mutationFn: (input: LoginInput) => loginUser(input),
    onSuccess: (_data, variables) => {
      // POST /auth/login returns no user payload — only the submitted email is known.
      setIdentity({ id: null, email: variables.email, name: null })
    },
  })
}

/**
 * Opens the demo: a new disposable account, already signed in. Whatever was
 * cached belongs to nobody now — a previous session's profile or children must
 * not flash before the demo's arrive — so the cache and the remembered identity
 * go here, and the caller then navigates to the dashboard, where the protected
 * layout asks `/auth/me` who this is. Navigation stays with the caller, as it
 * does for login and logout.
 */
export function useStartDemoSession() {
  const queryClient = useQueryClient()
  const clearIdentity = useAuthIdentityStore((state) => state.clearIdentity)

  return useMutation({
    mutationFn: startDemoSession,
    onSuccess: () => {
      queryClient.clear()
      clearIdentity()
    },
  })
}

/** The message for a demo that did not open: the per-address limit has its own, everything else one generic. */
export function demoStartErrorKey(error: unknown): string {
  return error instanceof ApiError && error.status === 429 ? 'demo.rateLimited' : 'demo.error'
}

export function useLogout() {
  const clearIdentity = useAuthIdentityStore((state) => state.clearIdentity)

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      clearIdentity()
      // Query cache is cleared once LoginRoute mounts (see LoginRoute.tsx), not here —
      // the protected shell's own useCurrentUser()/useBabies() observers are often still
      // mounted at this point, and clearing immediately makes them refetch with the
      // now-gone cookie, producing an unwanted 401 → hard-redirect flash before the SPA
      // navigation lands.
    },
  })
}

/**
 * Requests a code. Both variants resolve the same way for an unknown address,
 * so the caller must not branch on the result to say anything about the
 * account — see auth.api.ts.
 */
export function useRequestAssistedCode(mode: AssistedMode) {
  return useMutation({
    mutationFn: (input: AssistedRequestInput) =>
      mode === 'reset' ? requestPasswordResetCode(input) : requestPasswordlessCode(input),
  })
}

/**
 * Redeems the code and, for a reset, sets the new password at the same time.
 * Both endpoints end in a session, so this mirrors useLogin: the response
 * carries no user payload, and only the submitted e-mail is known here.
 */
export function useVerifyAssistedCode(mode: AssistedMode) {
  const setIdentity = useAuthIdentityStore((state) => state.setIdentity)

  return useMutation({
    mutationFn: (input: PasswordResetVerifyInput) =>
      mode === 'reset'
        ? verifyPasswordReset(input)
        : verifyPasswordlessCode({ email: input.email, code: input.code }),
    onSuccess: (_data, variables) => {
      setIdentity({ id: null, email: variables.email, name: null })
    },
  })
}
