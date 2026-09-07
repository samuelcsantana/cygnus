// @vitest-environment node
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

// Execute the actual worker with Cache Storage and fetch doubles; no browser or
// backend is needed to reproduce an HTTP 500 poisoning the offline shell.
const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')

function worker() {
  const listeners = new Map<string, (event: unknown) => void>()
  const stored = new Map<string, Response>()
  const put = vi.fn(async (key: string, response: Response) => { stored.set(key, response) })
  const fetch = vi.fn()
  runInNewContext(source, {
    URL, Response, fetch,
    self: {
      location: { origin: 'https://app.test' },
      addEventListener: (name: string, listener: (event: unknown) => void) => listeners.set(name, listener),
    },
    caches: {
      open: async () => ({ put }),
      match: async (key: string) => stored.get(key)?.clone(),
    },
  })
  function request(path = '/dashboard', mode = 'navigate') {
    const respondWith = vi.fn()
    listeners.get('fetch')!({
      request: { method: 'GET', url: `https://app.test${path}`, mode }, respondWith,
    })
    return { respondWith, response: respondWith.mock.calls[0]?.[0] as Promise<Response> | undefined }
  }
  return { fetch, put, stored, request }
}

describe('service worker offline shell', () => {
  it('keeps the last good HTML after a server error and serves it offline', async () => {
    const sw = worker()
    sw.fetch.mockResolvedValueOnce(new Response('working app', { headers: { 'content-type': 'text/html' } }))
    await sw.request().response
    sw.fetch.mockResolvedValueOnce(new Response('failed deploy', { status: 500 }))
    expect((await sw.request().response)?.status).toBe(500)
    sw.fetch.mockRejectedValueOnce(new TypeError('Offline'))
    expect(await (await sw.request().response)?.text()).toBe('working app')
    expect(sw.put).toHaveBeenCalledTimes(1)
  })

  it('does not replace HTML with a successful non-HTML response', async () => {
    const sw = worker()
    sw.fetch.mockResolvedValueOnce(new Response('{}', { headers: { 'content-type': 'application/json' } }))
    await sw.request().response
    expect(sw.put).not.toHaveBeenCalled()
  })

  it('returns a successful network response even when cache writes fail', async () => {
    const sw = worker()
    sw.put.mockRejectedValueOnce(new Error('Quota exceeded'))
    sw.fetch.mockResolvedValueOnce(new Response('working app', { headers: { 'content-type': 'text/html' } }))
    expect(await (await sw.request().response)?.text()).toBe('working app')
  })

  it('waits for the cache write before completing the fetch event', async () => {
    const sw = worker()
    let finishWrite!: () => void
    sw.put.mockImplementationOnce(() => new Promise<void>((resolve) => { finishWrite = resolve }))
    sw.fetch.mockResolvedValueOnce(new Response('app', { headers: { 'content-type': 'text/html' } }))
    const response = sw.request().response!
    const finished = vi.fn()
    void response.then(finished)
    await vi.waitFor(() => expect(sw.put).toHaveBeenCalledOnce())
    expect(finished).not.toHaveBeenCalled()
    finishWrite()
    await response
    expect(finished).toHaveBeenCalledOnce()
  })

  it.each(['/api/babies', '/uploads/photo.jpg', '/embed/iframe.html', '/mf/remoteEntry.js'])(
    'never intercepts %s', (path) => {
      const sw = worker()
      expect(sw.request(path).respondWith).not.toHaveBeenCalled()
      expect(sw.fetch).not.toHaveBeenCalled()
    },
  )
})
