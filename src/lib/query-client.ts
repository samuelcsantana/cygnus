import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { ApiError } from './http-client'

/**
 * The web shell (app/providers) injects the actual navigation behavior for a
 * session-expiry (401) here, so this module stays free of DOM/browser APIs —
 * a React Native port would inject its own navigation instead.
 */
let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler
}

function handleError(error: unknown): void {
  if (error instanceof ApiError && error.status === 401) {
    unauthorizedHandler?.()
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
          return false
        }
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
  queryCache: new QueryCache({ onError: handleError }),
  mutationCache: new MutationCache({ onError: handleError }),
})
