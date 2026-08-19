import { config } from './config'
import { ApiError, csrfHeaders, refreshSession, type ApiErrorBody } from './http-client'

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
 * A dedicated multipart/form-data POST helper — httpClient (lib/http-client.ts)
 * always JSON-stringifies its body and sets `Content-Type: application/json`,
 * which is wrong for a file upload (the browser must set its own
 * `multipart/form-data; boundary=...` Content-Type). Still mirrors the same
 * cookie/CSRF/single-refresh-retry contract as httpClient.
 */
export async function uploadFile<T>(path: string, fieldName: string, file: File, isRetry = false): Promise<T> {
  const formData = new FormData()
  formData.append(fieldName, file)

  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: csrfHeaders('POST'),
    body: formData,
  })

  if (response.status === 401 && !isRetry) {
    const refreshed = await refreshSession()
    if (refreshed) {
      return uploadFile<T>(path, fieldName, file, true)
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
