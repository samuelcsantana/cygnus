import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'

import { useBabies } from '@/features/babies/api/babies.hooks'
import type { Baby } from '@/features/babies/api/babies.schemas'

import {
  createMedication,
  deleteMedication,
  endMedication,
  fetchMedications,
  updateMedication,
} from './medications.api'
import type { Medication, MedicationFormInput } from './medications.schemas'

export function medicationsQueryKey(babyId: string) {
  return ['babies', babyId, 'medications'] as const
}

// Most recently started first, matching what the API already sends. The order is repeated here
// because optimistic cache writes below insert into an existing list, and a list that drifts out
// of order between a write and the next fetch reads as the app losing track of the record.
function byNewestFirst(a: Medication, b: Medication) {
  return b.startedOn.localeCompare(a.startedOn)
}

function sortByNewestFirst(items: Medication[]): Medication[] {
  return [...items].sort(byNewestFirst)
}

export function useMedications(babyId: string | null) {
  return useQuery({
    queryKey: medicationsQueryKey(babyId ?? ''),
    queryFn: () => fetchMedications(babyId!),
    enabled: !!babyId,
    select: sortByNewestFirst,
  })
}

export interface BabyMedicationsEntry {
  baby: Baby
  items: Medication[]
  isPending: boolean
  isError: boolean
}

export interface AllBabiesMedications {
  babies: Baby[]
  isPending: boolean
  isError: boolean
  isEmpty: boolean
  perBaby: BabyMedicationsEntry[]
  items: Medication[]
}

export function useAllBabiesMedications(): AllBabiesMedications {
  const babies = useBabies()
  const babyList = babies.data ?? []

  const results = useQueries({
    queries: babyList.map((baby) => ({
      queryKey: medicationsQueryKey(baby.id),
      queryFn: () => fetchMedications(baby.id),
      enabled: babies.isSuccess,
      select: sortByNewestFirst,
    })),
  })

  const perBaby: BabyMedicationsEntry[] = babyList.map((baby, index) => {
    const result = results[index]
    return {
      baby,
      items: result?.data ?? [],
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

export function useCreateMedication(babyId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: MedicationFormInput) => createMedication(babyId!, input),
    onSuccess: (medication) => {
      queryClient.setQueryData<Medication[]>(medicationsQueryKey(babyId ?? ''), (prev) =>
        (prev ? [...prev, medication] : [medication]).sort(byNewestFirst),
      )
    },
  })
}

export function useUpdateMedication(babyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ medicationId, input }: { medicationId: string; input: MedicationFormInput }) =>
      updateMedication(babyId, medicationId, input),
    onSuccess: (medication) => {
      queryClient.setQueryData<Medication[]>(medicationsQueryKey(babyId), (prev) =>
        prev?.map((item) => (item.id === medication.id ? medication : item)).sort(byNewestFirst),
      )
    },
  })
}

export function useEndMedication(babyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ medicationId, endedOn }: { medicationId: string; endedOn: string }) =>
      endMedication(babyId, medicationId, endedOn),
    onSuccess: (medication) => {
      queryClient.setQueryData<Medication[]>(medicationsQueryKey(babyId), (prev) =>
        prev?.map((item) => (item.id === medication.id ? medication : item)),
      )
    },
  })
}

export function useDeleteMedication(babyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (medicationId: string) => deleteMedication(babyId, medicationId),
    onSuccess: (_data, deletedId) => {
      queryClient.setQueryData<Medication[]>(medicationsQueryKey(babyId), (prev) =>
        prev?.filter((item) => item.id !== deletedId),
      )
    },
  })
}
