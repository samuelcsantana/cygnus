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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
}
