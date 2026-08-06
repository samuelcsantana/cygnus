import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'

import { useBabies } from '@/features/babies/api/babies.hooks'
import type { Baby } from '@/features/babies/api/babies.schemas'

import { applyVaccine, fetchAdhocVaccines, fetchVaccineCalendar, registerAdhocVaccine } from './vaccines.api'
import type {
  AdhocVaccineRecord,
  ApplyVaccineInput,
  CreateAdhocVaccineInput,
  VaccineAgeGroup,
  VaccineItem,
} from './vaccines.schemas'

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

export interface VaccineItemWithBaby extends VaccineItem {
  babyId: string
}

export interface BabyVaccineCalendarEntry {
  baby: Baby
  groups: VaccineAgeGroup[]
  items: VaccineItemWithBaby[]
  isPending: boolean
  isError: boolean
}

export interface AllBabiesVaccineCalendars {
  babies: Baby[]
  isPending: boolean
  isError: boolean
  isEmpty: boolean
  perBaby: BabyVaccineCalendarEntry[]
  items: VaccineItemWithBaby[]
}

// Vaccine schedule items don't carry a babyId of their own (only the fetch call is
// baby-scoped) — this stamps one on client-side so a merged household view can tell
// whose dose is whose.
export function useAllBabiesVaccineCalendars(): AllBabiesVaccineCalendars {
  const babies = useBabies()
  const babyList = babies.data ?? []

  const results = useQueries({
    queries: babyList.map((baby) => ({
      queryKey: vaccinesQueryKey(baby.id),
      queryFn: () => fetchVaccineCalendar(baby.id),
      enabled: babies.isSuccess,
    })),
  })

  const perBaby: BabyVaccineCalendarEntry[] = babyList.map((baby, index) => {
    const result = results[index]
    const groups = result?.data ?? []
    return {
      baby,
      groups,
      items: groups.flatMap((group) => group.items.map((item) => ({ ...item, babyId: baby.id }))),
      isPending: result?.isPending ?? true,
      isError: result?.isError ?? false,
    }
  })

  return {
    babies: babyList,
    isPending: babies.isPending || (babies.isSuccess && results.some((result) => result.isPending)),
    isError: babies.isError || results.some((result) => result.isError),
    isEmpty: babies.isSuccess && babyList.length === 0,
    perBaby,
    items: perBaby.flatMap((entry) => entry.items),
  }
}

interface ApplyVaccineVariables {
  vaccineId: string
  input: ApplyVaccineInput
}

export function useApplyVaccine(babyId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ vaccineId, input }: ApplyVaccineVariables) => applyVaccine(babyId!, vaccineId, input),
    onSuccess: (updatedItem) => {
      queryClient.setQueryData<VaccineAgeGroup[]>(vaccinesQueryKey(babyId ?? ''), (prev) =>
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

export interface AllBabiesAdhocVaccines {
  isPending: boolean
  isError: boolean
  items: AdhocVaccineRecord[]
}

export function useAllBabiesAdhocVaccines(): AllBabiesAdhocVaccines {
  const babies = useBabies()
  const babyList = babies.data ?? []

  const results = useQueries({
    queries: babyList.map((baby) => ({
      queryKey: adhocVaccinesQueryKey(baby.id),
      queryFn: () => fetchAdhocVaccines(baby.id),
      enabled: babies.isSuccess,
    })),
  })

  return {
    isPending: babies.isPending || (babies.isSuccess && results.some((result) => result.isPending)),
    isError: babies.isError || results.some((result) => result.isError),
    items: results.flatMap((result) => result.data ?? []),
  }
}

export function useRegisterAdhocVaccine(babyId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateAdhocVaccineInput) => registerAdhocVaccine(babyId!, input),
    onSuccess: (created) => {
      queryClient.setQueryData<AdhocVaccineRecord[]>(adhocVaccinesQueryKey(babyId ?? ''), (prev) => [
        created,
        ...(prev ?? []),
      ])
    },
  })
}
