import { useMutation, useQuery } from '@tanstack/react-query'

import { ApiError } from '@/lib/http-client'

import { fetchInvitePreview, redeemInvite } from './invites.api'

export function inviteQueryKey(code: string) {
  return ['invites', code] as const
}

export function useInvitePreview(code: string) {
  return useQuery({
    queryKey: inviteQueryKey(code),
    queryFn: () => fetchInvitePreview(code),
    enabled: !!code,
    // A 404 (unknown code) is a definitive answer, not a transient failure —
    // don't burn retries on it (mirrors the global default in query-client.ts).
    retry: (failureCount, error) => !(error instanceof ApiError && error.status === 404) && failureCount < 2,
  })
}

export function useRedeemInvite(code: string) {
  return useMutation({
    mutationFn: () => redeemInvite(code),
  })
}
