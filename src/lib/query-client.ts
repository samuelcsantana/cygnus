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

/**
 * A query may declare that a 401 is an expected answer rather than a session
 * expiry. Without this every 401 is treated as "your session died, go to
 * /login" — which is right for the protected shell and wrong for a public
 * route that merely *asks* whether anyone is signed in.
 */
export interface QueryMeta {
  /** A 401 here means "not signed in", not "session expired". */
  readonly expectsAnonymous?: boolean
}

function handleError(error: unknown, source?: { meta?: Record<string, unknown> }): void {
  if (!(error instanceof ApiError) || error.status !== 401) return
  if ((source?.meta as QueryMeta | undefined)?.expectsAnonymous) return
  unauthorizedHandler?.()
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
  // The second argument is the query (or mutation) that failed — that is where
  // `meta.expectsAnonymous` is read from, so the opt-out is per call site
  // rather than global. `useCurrentUser` is shared: the protected shell wants
  // the redirect, the public invite screen must not have it.
  queryCache: new QueryCache({ onError: (error, query) => handleError(error, query) }),
  mutationCache: new MutationCache({ onError: (error, _vars, _ctx, mutation) => handleError(error, mutation) }),
})
