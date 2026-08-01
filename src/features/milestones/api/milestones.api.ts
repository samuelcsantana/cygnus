import { httpClient } from '@/lib/http-client'

import { milestoneListSchema, milestoneSchema, type Milestone, type MilestoneFormInput } from './milestones.schemas'

export async function fetchMilestones(babyId: string): Promise<Milestone[]> {
  const response = await httpClient.get<unknown>(`/babies/${babyId}/milestones`)
  return milestoneListSchema.parse(response)
}

export async function createMilestone(babyId: string, input: MilestoneFormInput): Promise<Milestone> {
  const body = {
    title: input.title,
    description: input.description || undefined,
    achievedAt: input.achievedAt,
    category: input.category,
    photoUrl: input.photoUrl || undefined,
  }
  const response = await httpClient.post<unknown>(`/babies/${babyId}/milestones`, body)
  return milestoneSchema.parse(response)
}
