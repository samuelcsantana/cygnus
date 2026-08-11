import { z } from 'zod'

// GET /invites/:code is public (no auth) — a logged-out user can preview an
// invite before deciding to log in/register to accept it.
export const invitePreviewSchema = z.object({
  babyName: z.string(),
  babyAvatarUrl: z.string().nullable(),
  expired: z.boolean(),
  alreadyUsed: z.boolean(),
})
export type InvitePreview = z.infer<typeof invitePreviewSchema>

export const redeemInviteResponseSchema = z.object({
  babyId: z.string().uuid(),
  babyName: z.string(),
})
export type RedeemInviteResponse = z.infer<typeof redeemInviteResponseSchema>
