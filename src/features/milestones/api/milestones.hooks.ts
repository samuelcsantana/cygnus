import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'

import { useBabies } from '@/features/babies/api/babies.hooks'
import type { Baby } from '@/features/babies/api/babies.schemas'

import { createMilestone, fetchMilestones, updateMilestone } from './milestones.api'
import type { Milestone, MilestoneFormInput } from './milestones.schemas'

export function milestonesQueryKey(babyId: string) {
  return ['babies', babyId, 'milestones'] as const
}

function byNewestFirst(a: Milestone, b: Milestone) {
  return b.achievedAt.localeCompare(a.achievedAt)
}

function sortByNewestFirst(items: Milestone[]): Milestone[] {
  return [...items].sort(byNewestFirst)
}

export function useMilestones(babyId: string | null) {
  return useQuery({
    queryKey: milestonesQueryKey(babyId ?? ''),
    queryFn: () => fetchMilestones(babyId!),
    enabled: !!babyId,
    select: sortByNewestFirst,
  })
}

export interface BabyMilestonesEntry {
  baby: Baby
  items: Milestone[]
  isPending: boolean
  isError: boolean
}

export interface AllBabiesMilestones {
  babies: Baby[]
  isPending: boolean
  isError: boolean
  isEmpty: boolean
  perBaby: BabyMilestonesEntry[]
  items: Milestone[]
}

export function useAllBabiesMilestones(): AllBabiesMilestones {
  const babies = useBabies()
  const babyList = babies.data ?? []

  const results = useQueries({
    queries: babyList.map((baby) => ({
      queryKey: milestonesQueryKey(baby.id),
      queryFn: () => fetchMilestones(baby.id),
      enabled: babies.isSuccess,
      select: sortByNewestFirst,
    })),
  })

  const perBaby: BabyMilestonesEntry[] = babyList.map((baby, index) => {
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

export function useCreateMilestone(babyId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: MilestoneFormInput) => createMilestone(babyId!, input),
    onSuccess: (milestone) => {
      queryClient.setQueryData<Milestone[]>(milestonesQueryKey(babyId ?? ''), (prev) =>
        (prev ? [...prev, milestone] : [milestone]).sort(byNewestFirst),
      )
    },
  })
}

export function useUpdateMilestone(babyId: string, milestoneId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: MilestoneFormInput) => updateMilestone(babyId, milestoneId, input),
    onSuccess: (milestone) => {
      queryClient.setQueryData<Milestone[]>(milestonesQueryKey(babyId), (prev) =>
        prev?.map((item) => (item.id === milestone.id ? milestone : item)).sort(byNewestFirst),
      )
    },
  })
}
