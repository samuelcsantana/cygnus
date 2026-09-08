import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { ApiError } from './http-client'
import { uploadFile } from './upload'

const api = (path: string) => config.apiBaseUrl + path
const file = new File(['photo'], 'photo.png', { type: 'image/png' })
afterEach(() => {
  vi.restoreAllMocks()
  document.cookie = 'csrf_token=; Max-Age=0; path=/'
})

describe('multipart uploads', () => {
  it('passes the original file and session headers without forcing a JSON content type', async () => {
    document.cookie = 'csrf_token=upload-csrf; path=/'
    const transport = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      HttpResponse.json({ url: '/uploads/photo.png' }),
    )
    await expect(uploadFile('/uploads/photos', 'photo', file)).resolves.toEqual({ url: '/uploads/photo.png' })
    const options = transport.mock.calls[0]?.[1]
    if (!options) throw new Error('Upload did not reach the transport')
    expect(options?.credentials).toBe('include')
    expect(options?.method).toBe('POST')
    expect(new Headers(options?.headers).get('x-csrf-token')).toBe('upload-csrf')
    expect(new Headers(options?.headers).has('content-type')).toBe(false)
    expect((options.body as FormData).get('photo')).toBe(file)
  })

  it.each([true, false])('retries at most once after a successful refresh (retry succeeds: %s)', async (succeeds) => {
    let uploads = 0
    let refreshes = 0
    server.use(
      http.post(api('/uploads/photos'), () => {
        uploads++
        return uploads === 2 && succeeds
          ? HttpResponse.json({ url: '/uploads/photo.png' })
          : HttpResponse.json({ status: 'error', message: 'Expired' }, { status: 401 })
      }),
      http.post(api('/auth/refresh'), () => {
        refreshes++
        return HttpResponse.json({ status: 'ok', message: 'Refreshed' })
      }),
    )
    const pending = uploadFile('/uploads/photos', 'photo', file)
    if (succeeds) await expect(pending).resolves.toEqual({ url: '/uploads/photo.png' })
    else await expect(pending).rejects.toMatchObject({ status: 401, message: 'Expired' })
    expect(uploads).toBe(2)
    expect(refreshes).toBe(1)
  })

  it('does not resend a file when refreshing the session fails', async () => {
    const upload = vi.fn(() => HttpResponse.json({ status: 'error', message: 'Expired' }, { status: 401 }))
    server.use(
      http.post(api('/uploads/photos'), upload),
      http.post(api('/auth/refresh'), () => new HttpResponse(null, { status: 401 })),
    )
    await expect(uploadFile('/uploads/photos', 'photo', file)).rejects.toBeInstanceOf(ApiError)
    expect(upload).toHaveBeenCalledTimes(1)
  })

  it('preserves server validation errors and handles non-JSON gateway failures', async () => {
    server.use(http.post(api('/uploads/photos'), () =>
      HttpResponse.json({ status: 'error', message: 'File exceeds limit' }, { status: 413 })))
    await expect(uploadFile('/uploads/photos', 'photo', file)).rejects.toMatchObject({
      status: 413, message: 'File exceeds limit',
    })
    server.use(http.post(api('/uploads/photos'), () =>
      new HttpResponse('Gateway unavailable', { status: 502, statusText: 'Bad Gateway' })))
    await expect(uploadFile('/uploads/photos', 'photo', file)).rejects.toMatchObject({
      status: 502, message: 'Bad Gateway',
    })
  })
})
