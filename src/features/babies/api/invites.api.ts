import { httpClient } from '@/lib/http-client'

import {
  invitePreviewSchema,
  redeemInviteResponseSchema,
  type InvitePreview,
  type RedeemInviteResponse,
} from './invites.schemas'

/** Public endpoint — no session required, used by InviteRedeemRoute for logged-out visitors. */
export async function fetchInvitePreview(code: string): Promise<InvitePreview> {
  const response = await httpClient.get<unknown>(`/invites/${code}`)
  return invitePreviewSchema.parse(response)
}

/** Requires an authenticated session — callers must check auth state before invoking this. */
export async function redeemInvite(code: string): Promise<RedeemInviteResponse> {
  const response = await httpClient.post<unknown>(`/invites/${code}/redeem`)
  return redeemInviteResponseSchema.parse(response)
}
