import { useMutation } from '@tanstack/react-query'

import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'

import { loginUser, logoutUser, registerUser } from './auth.api'
import type { LoginInput, RegisterInput } from './auth.schemas'

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
      // the protected shell's own useBabies() observer is often still mounted at this
      // point, and clearing immediately makes it refetch with the now-gone cookie,
      // producing an unwanted 401 → hard-redirect flash before the SPA navigation lands.
    },
  })
}
