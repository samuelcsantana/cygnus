import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createBaby,
  createBabyInvite,
  deleteBaby,
  fetchBabies,
  fetchBabyGuardians,
  removeBabyGuardian,
  updateBaby,
} from './babies.api'
import type { Baby, BabyFormInput, Guardian } from './babies.schemas'

export const babiesQueryKey = ['babies'] as const

/**
 * Also doubles as the app's session probe (see app/routes/ProtectedLayout.tsx):
 * there is no dedicated /auth/me endpoint, so a 401 here means "not logged in".
 */
export function useBabies() {
  return useQuery({
    queryKey: babiesQueryKey,
    queryFn: fetchBabies,
  })
}

/** Used by the "Add" wizards to auto-select (and hide the picker) when there's only one baby. */
export function soleBaby(babies: Baby[] | undefined): Baby | undefined {
  return babies?.length === 1 ? babies[0] : undefined
}

export function useCreateBaby() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBaby,
    onSuccess: (baby) => {
      queryClient.setQueryData<Baby[]>(babiesQueryKey, (prev) => (prev ? [...prev, baby] : [baby]))
    },
  })
}

export function useUpdateBaby(babyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: BabyFormInput) => updateBaby(babyId, input),
    onSuccess: (updated) => {
      queryClient.setQueryData<Baby[]>(babiesQueryKey, (prev) =>
        prev?.map((baby) => (baby.id === updated.id ? updated : baby)),
      )
    },
  })
}

export function useDeleteBaby() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (babyId: string) => deleteBaby(babyId),
    onSuccess: (_data, deletedBabyId) => {
      queryClient.setQueryData<Baby[]>(babiesQueryKey, (prev) =>
        prev?.filter((baby) => baby.id !== deletedBabyId),
      )
    },
  })
}

export function babyGuardiansQueryKey(babyId: string) {
  return ['babies', babyId, 'guardians'] as const
}

export function useBabyGuardians(babyId: string) {
  return useQuery({
    queryKey: babyGuardiansQueryKey(babyId),
    queryFn: () => fetchBabyGuardians(babyId),
    enabled: !!babyId,
  })
}

export function useCreateBabyInvite(babyId: string) {
  return useMutation({
    mutationFn: (inviteeEmail?: string) => createBabyInvite(babyId, inviteeEmail),
  })
}

export function useRemoveBabyGuardian(babyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => removeBabyGuardian(babyId, userId),
    onSuccess: (_data, removedUserId) => {
      queryClient.setQueryData<Guardian[]>(babyGuardiansQueryKey(babyId), (prev) =>
        prev?.filter((guardian) => guardian.userId !== removedUserId),
      )
    },
  })
}
