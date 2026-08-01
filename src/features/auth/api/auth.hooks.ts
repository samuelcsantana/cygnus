import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'

import { getCurrentUser, loginUser, logoutUser, registerUser } from './auth.api'
import type { LoginInput, RegisterInput } from './auth.schemas'

export const currentUserQueryKey = ['auth', 'me'] as const

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    staleTime: 5 * 60_000,
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
  const setSelectedBabyId = useSelectedBabyStore((state) => state.setSelectedBabyId)

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      clearIdentity()
      // Persisted across sessions (selectedBaby.store.ts) — clear it so a
      // different account on the same device never inherits a baby
      // selection that belongs to someone else.
      setSelectedBabyId(null)
      // Query cache is cleared once LoginRoute mounts (see LoginRoute.tsx), not here —
      // the protected shell's own useCurrentUser()/useBabies() observers are often still
      // mounted at this point, and clearing immediately makes them refetch with the
      // now-gone cookie, producing an unwanted 401 → hard-redirect flash before the SPA
      // navigation lands.
    },
  })
}
