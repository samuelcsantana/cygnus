import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createMilestone, fetchMilestones, updateMilestone } from './milestones.api'
import type { Milestone, MilestoneFormInput } from './milestones.schemas'

export function milestonesQueryKey(babyId: string) {
  return ['babies', babyId, 'milestones'] as const
}

function byNewestFirst(a: Milestone, b: Milestone) {
  return b.achievedAt.localeCompare(a.achievedAt)
}

export function useMilestones(babyId: string | null) {
  return useQuery({
    queryKey: milestonesQueryKey(babyId ?? ''),
    queryFn: () => fetchMilestones(babyId!),
    enabled: !!babyId,
    select: (data) => [...data].sort(byNewestFirst),
  })
}

export function useCreateMilestone(babyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: MilestoneFormInput) => createMilestone(babyId, input),
    onSuccess: (milestone) => {
      queryClient.setQueryData<Milestone[]>(milestonesQueryKey(babyId), (prev) =>
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
