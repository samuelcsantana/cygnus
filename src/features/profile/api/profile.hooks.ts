import { useMutation, useQueryClient } from '@tanstack/react-query'

import { currentUserQueryKey } from '@/features/auth/api/auth.hooks'
import type { User } from '@/features/auth/api/auth.schemas'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'

import {
  deleteAccount,
  requestDeletionCode,
  updateProfile,
  type DeleteAccountProof,
  type UpdateProfilePayload,
} from './profile.api'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const setIdentity = useAuthIdentityStore((state) => state.setIdentity)

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (user) => {
      queryClient.setQueryData<User>(currentUserQueryKey, user)
      setIdentity({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl })
    },
  })
}

export function useDeleteAccount() {
  const clearIdentity = useAuthIdentityStore((state) => state.clearIdentity)

  return useMutation({
    mutationFn: (proof: DeleteAccountProof) => deleteAccount(proof),
    onSuccess: () => {
      clearIdentity()
    },
  })
}

/** Asks for the code that confirms deletion. Answers 200 even when throttled, so there is no error path worth branching on. */
export function useRequestDeletionCode() {
  return useMutation({ mutationFn: requestDeletionCode })
}
