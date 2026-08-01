import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createBaby, fetchBabies, updateBaby } from './babies.api'
import type { Baby, BabyFormInput } from './babies.schemas'

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
