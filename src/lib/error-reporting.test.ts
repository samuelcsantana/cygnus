import { afterEach, describe, expect, it, vi } from 'vitest'

// Hoisted so the factory below can close over them.
const { initSpy, tracingSpy, captureSpy } = vi.hoisted(() => ({
  initSpy: vi.fn(),
  tracingSpy: vi.fn(() => ({ name: 'BrowserTracing' })),
  captureSpy: vi.fn(),
}))

vi.mock('@sentry/react', () => ({
  init: initSpy,
  browserTracingIntegration: tracingSpy,
  captureException: captureSpy,
}))

const DSN = 'https://public@o0.ingest.us.sentry.io/1'

/**
 * The module reads import.meta.env at import time, so each case needs a fresh
 * module registry rather than a re-render.
 */
async function loadWithDsn(dsn: string | undefined) {
  vi.resetModules()
  vi.stubEnv('VITE_SENTRY_DSN', dsn ?? '')
  return import('./error-reporting')
}

afterEach(() => {
  vi.unstubAllEnvs()
  initSpy.mockClear()
  tracingSpy.mockClear()
  captureSpy.mockClear()
})

describe('reportRequestError privacy', () => {
  it('reports HTTP status without the API body or original message', async () => {
    const { reportRequestError } = await loadWithDsn(DSN)
    const { ApiError } = await import('./http-client')
    reportRequestError(new ApiError(500, { status: 'error', message: 'private child details' }, 'private child details'), 'mutation')
    const [error, options] = captureSpy.mock.calls[0]!
    expect(error.message).toBe('API request failed (HTTP 500)')
    expect(options.extra).toEqual({ operation: 'mutation', status: 500 })
    expect(JSON.stringify([error, options])).not.toContain('private child details')
  })

  it('reports schema paths and codes without Zod received values or messages', async () => {
    const { reportRequestError } = await loadWithDsn(DSN)
    const { z } = await import('zod')
    const result = z.object({ status: z.enum(['ok']) }).safeParse({ status: 'private child details' })
    if (result.success) throw new Error('Expected invalid fixture')
    reportRequestError(result.error, 'query')
    const [error, options] = captureSpy.mock.calls[0]!
    expect(error.message).toBe('API schema validation failed')
    expect(options.extra).toEqual({
      operation: 'query', issues: [{ code: 'invalid_enum_value', path: ['status'] }],
    })
    expect(JSON.stringify([error, options])).not.toContain('private child details')
  })

  it('does not forward arbitrary exception messages', async () => {
    const { reportRequestError } = await loadWithDsn(DSN)
    reportRequestError(new TypeError('Failed to fetch /babies/private-id'), 'query')
    const [error, options] = captureSpy.mock.calls[0]!
    expect(error.message).toBe('Request failed with TypeError')
    expect(options.extra).toEqual({ operation: 'query' })
  })
})

describe('initErrorReporting', () => {
  it('registers the tracing integration, without which no span is ever produced', async () => {
    // Regression guard. browserTracingIntegration is NOT part of
    // getDefaultIntegrations(), so an init that only sets tracesSampleRate
    // collects no Web Vitals and fails silently — errors keep arriving, which
    // is what made it look configured.
    const { initErrorReporting } = await loadWithDsn(DSN)

    initErrorReporting()

    expect(tracingSpy).toHaveBeenCalledOnce()
    const options = initSpy.mock.calls[0]?.[0]
    expect(options.integrations).toContainEqual({ name: 'BrowserTracing' })
  })

  it('samples every pageload, so a quiet day reads as no traffic and not as no data', async () => {
    const { initErrorReporting } = await loadWithDsn(DSN)

    initErrorReporting()

    expect(initSpy.mock.calls[0]?.[0].tracesSampleRate).toBe(1.0)
  })

  it('propagates trace headers to same-origin requests only', async () => {
    // photoUrl and avatarUrl accept any host by design; an unset list would let
    // trace headers ride along to a third party the user pasted in.
    const { initErrorReporting } = await loadWithDsn(DSN)

    initErrorReporting()

    const targets = initSpy.mock.calls[0]?.[0].tracePropagationTargets
    expect(targets).toEqual([/^\//])
    expect(targets.some((t: RegExp) => t.test('/api/babies'))).toBe(true)
    expect(targets.some((t: RegExp) => t.test('https://example.com/pic.png'))).toBe(false)
  })

  it('stays inert without a DSN, so local builds never ship events', async () => {
    const { initErrorReporting } = await loadWithDsn(undefined)

    initErrorReporting()

    expect(initSpy).not.toHaveBeenCalled()
  })
})
