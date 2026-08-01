import { HttpResponse, http } from 'msw'

import { config } from '@/lib/config'

const api = (path: string) => `${config.apiBaseUrl}${path}`

/**
 * Sane defaults so components under test don't crash on unrelated requests.
 * Individual tests override the endpoint they care about via `server.use()`.
 */
export const handlers = [
  http.get(api('/babies'), () => HttpResponse.json([])),
  http.get(api('/notifications'), () => HttpResponse.json([])),
]
