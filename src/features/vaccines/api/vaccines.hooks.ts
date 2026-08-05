import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applyVaccine, fetchAdhocVaccines, fetchVaccineCalendar, registerAdhocVaccine } from './vaccines.api'
import type { AdhocVaccineRecord, ApplyVaccineInput, CreateAdhocVaccineInput, VaccineAgeGroup } from './vaccines.schemas'

export function vaccinesQueryKey(babyId: string) {
  return ['babies', babyId, 'vaccines'] as const
}

export function useVaccineCalendar(babyId: string | null) {
  return useQuery({
    queryKey: vaccinesQueryKey(babyId ?? ''),
    queryFn: () => fetchVaccineCalendar(babyId!),
    enabled: !!babyId,
  })
}

interface ApplyVaccineVariables {
  vaccineId: string
  input: ApplyVaccineInput
}

export function useApplyVaccine(babyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ vaccineId, input }: ApplyVaccineVariables) => applyVaccine(babyId, vaccineId, input),
    onSuccess: (updatedItem) => {
      queryClient.setQueryData<VaccineAgeGroup[]>(vaccinesQueryKey(babyId), (prev) =>
        prev?.map((group) => ({
          ...group,
          items: group.items.map((item) => (item.vaccineId === updatedItem.vaccineId ? updatedItem : item)),
        })),
      )
    },
  })
}

export function adhocVaccinesQueryKey(babyId: string) {
  return ['babies', babyId, 'vaccines', 'adhoc'] as const
}

export function useAdhocVaccines(babyId: string | null) {
  return useQuery({
    queryKey: adhocVaccinesQueryKey(babyId ?? ''),
    queryFn: () => fetchAdhocVaccines(babyId!),
    enabled: !!babyId,
  })
}

export function useRegisterAdhocVaccine(babyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateAdhocVaccineInput) => registerAdhocVaccine(babyId, input),
    onSuccess: (created) => {
      queryClient.setQueryData<AdhocVaccineRecord[]>(adhocVaccinesQueryKey(babyId), (prev) => [
        created,
        ...(prev ?? []),
      ])
    },
  })
}
