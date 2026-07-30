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

/**
 * Unlike create, edit always sends the full form state (null for cleared
 * optional fields) rather than omitting untouched-looking fields — the form
 * is pre-filled with the current milestone, so every field the user sees is
 * an explicit value, not a partial patch. Mirrors babies.api.ts#updateBaby.
 */
export async function updateMilestone(
  babyId: string,
  milestoneId: string,
  input: MilestoneFormInput,
): Promise<Milestone> {
  const body = {
    title: input.title,
    description: input.description || null,
    achievedAt: input.achievedAt,
    category: input.category,
    photoUrl: input.photoUrl || null,
  }
  const response = await httpClient.patch<unknown>(`/babies/${babyId}/milestones/${milestoneId}`, body)
  return milestoneSchema.parse(response)
}
