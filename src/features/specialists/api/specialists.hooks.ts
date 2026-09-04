import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { appointmentsQueryKey } from '@/features/appointments/api/appointments.hooks'

import { createSpecialist, deleteSpecialist, fetchSpecialists, updateSpecialist } from './specialists.api'
import type { Specialist, SpecialistFormInput } from './specialists.schemas'

export function specialistsQueryKey(babyId: string) {
  return ['babies', babyId, 'specialists'] as const
}

function byName(a: Specialist, b: Specialist) {
  return a.name.localeCompare(b.name)
}

export function useSpecialists(babyId: string | null) {
  return useQuery({
    queryKey: specialistsQueryKey(babyId ?? ''),
    queryFn: () => fetchSpecialists(babyId!),
    enabled: !!babyId,
  })
}

export function useCreateSpecialist(babyId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SpecialistFormInput) => createSpecialist(babyId!, input),
    onSuccess: (specialist) => {
      queryClient.setQueryData<Specialist[]>(specialistsQueryKey(babyId ?? ''), (prev) =>
        (prev ? [...prev, specialist] : [specialist]).sort(byName),
      )
    },
  })
}

export function useUpdateSpecialist(babyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ specialistId, input }: { specialistId: string; input: SpecialistFormInput }) =>
      updateSpecialist(babyId, specialistId, input),
    onSuccess: (specialist) => {
      queryClient.setQueryData<Specialist[]>(specialistsQueryKey(babyId), (prev) =>
        prev?.map((item) => (item.id === specialist.id ? specialist : item)).sort(byName),
      )
    },
  })
}

export function useDeleteSpecialist(babyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (specialistId: string) => deleteSpecialist(babyId, specialistId),
    onSuccess: (_data, deletedId) => {
      queryClient.setQueryData<Specialist[]>(specialistsQueryKey(babyId), (prev) =>
        prev?.filter((item) => item.id !== deletedId),
      )
      // Removing a specialist nulls `specialistId` on the visits they attended (the API's foreign
      // key does it), so any appointment list already in the cache is now stale on that one field.
      // The visits themselves are untouched — this is a refetch, not a repair.
      queryClient.invalidateQueries({ queryKey: appointmentsQueryKey(babyId) })
    },
  })
}
