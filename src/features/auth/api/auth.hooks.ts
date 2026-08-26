import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  requestPasswordResetCode,
  requestPasswordlessCode,
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
      setIdentity({ id: currentUser.data.id, email: currentUser.data.email, name: currentUser.data.name })
    }
  }, [currentUser.data, setIdentity])

  return currentUser
}

export function useRegister() {
  const setIdentity = useAuthIdentityStore((state) => state.setIdentity)

  return useMutation({
    mutationFn: (input: RegisterInput) => registerUser(input),
    onSuccess: (user) => {
      setIdentity({ id: user.id, email: user.email, name: user.name })
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
