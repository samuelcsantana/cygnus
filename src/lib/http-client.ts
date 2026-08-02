import { config } from './config'

export interface ApiErrorBody {
  status: 'error'
  message: string
}

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody | undefined

  constructor(status: number, body: ApiErrorBody | undefined, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'message' in value &&
    (value as { status: unknown }).status === 'error'
  )
}

/**
 * The backend does not track refresh sessions server-side beyond the cookie
 * itself, so "refreshing" is just: call /auth/refresh once, let the browser
 * store the rotated cookies, and retry the original request. Concurrent 401s
 * (e.g. several queries firing at once) share one in-flight refresh instead
 * of each triggering their own POST /auth/refresh.
 */
let refreshPromise: Promise<boolean> | null = null

function refreshSession(): Promise<boolean> {
  refreshPromise ??= fetch(`${config.apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

// A 401 from these is never a stale-access-token situation, so retrying them
// after a silent refresh would be meaningless (or, for /auth/refresh itself, recursive).
const SESSION_REFRESH_EXEMPT_PATHS = new Set(['/auth/login', '/auth/refresh'])

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { body, headers, ...rest } = options

  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401 && !isRetry && !SESSION_REFRESH_EXEMPT_PATHS.has(path)) {
    const refreshed = await refreshSession()
    if (refreshed) {
      return request<T>(path, options, true)
    }
  }

  const isJson = response.headers.get('content-type')?.includes('application/json') ?? false
  const data: unknown = isJson ? await response.json() : undefined

  if (!response.ok) {
    const errorBody = isApiErrorBody(data) ? data : undefined
    throw new ApiError(response.status, errorBody, errorBody?.message ?? response.statusText)
  }

  return data as T
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
}
