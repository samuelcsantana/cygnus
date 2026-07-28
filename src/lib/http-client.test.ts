import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'

import { ApiError, httpClient } from './http-client'

const api = (path: string) => `${config.apiBaseUrl}${path}`

describe('httpClient session refresh', () => {
  it('silently refreshes an expired access token and retries the original request once', async () => {
    let babiesCallCount = 0
    let refreshCallCount = 0

    server.use(
      http.get(api('/babies'), () => {
        babiesCallCount += 1
        return babiesCallCount === 1
          ? HttpResponse.json({ status: 'error', message: 'Authentication required' }, { status: 401 })
          : HttpResponse.json([{ id: 'baby-1' }])
      }),
      http.post(api('/auth/refresh'), () => {
        refreshCallCount += 1
        return HttpResponse.json({ status: 'ok', message: 'Session refreshed successfully' })
      }),
    )

    const result = await httpClient.get('/babies')

    expect(result).toEqual([{ id: 'baby-1' }])
    expect(babiesCallCount).toBe(2)
    expect(refreshCallCount).toBe(1)
  })

  it('propagates a 401 without looping when the refresh itself fails', async () => {
    let babiesCallCount = 0

    server.use(
      http.get(api('/babies'), () => {
        babiesCallCount += 1
        return HttpResponse.json({ status: 'error', message: 'Authentication required' }, { status: 401 })
      }),
      http.post(api('/auth/refresh'), () =>
        HttpResponse.json({ status: 'error', message: 'Invalid or expired token' }, { status: 401 }),
      ),
    )

    await expect(httpClient.get('/babies')).rejects.toThrow(ApiError)
    expect(babiesCallCount).toBe(1)
  })

  it('does not attempt a silent refresh for a 401 from /auth/login itself', async () => {
    let refreshCallCount = 0

    server.use(
      http.post(api('/auth/login'), () =>
        HttpResponse.json({ status: 'error', message: 'Invalid credentials' }, { status: 401 }),
      ),
      http.post(api('/auth/refresh'), () => {
        refreshCallCount += 1
        return HttpResponse.json({ status: 'ok', message: 'Session refreshed successfully' })
      }),
    )

    await expect(httpClient.post('/auth/login', { email: 'a@a.com', password: 'wrong' })).rejects.toThrow(ApiError)
    expect(refreshCallCount).toBe(0)
  })
})
