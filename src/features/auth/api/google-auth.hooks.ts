import { useQuery } from '@tanstack/react-query'
import { getGoogleStatus } from './google-auth.api'

export const googleAuthQueryKeys = {
  status: ['auth', 'google', 'status'] as const,
  complete: ['auth', 'google', 'complete'] as const,
}

export function useGoogleStatus() {
  return useQuery({ queryKey: googleAuthQueryKeys.status, queryFn: getGoogleStatus, staleTime: 60_000, retry: false })
}
