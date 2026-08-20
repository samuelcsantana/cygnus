import { afterEach, describe, expect, it, vi } from 'vitest'

// Hoisted so the factory below can close over them.
const { initSpy, tracingSpy } = vi.hoisted(() => ({
  initSpy: vi.fn(),
  tracingSpy: vi.fn(() => ({ name: 'BrowserTracing' })),
}))

vi.mock('@sentry/react', () => ({
  init: initSpy,
  browserTracingIntegration: tracingSpy,
  captureException: vi.fn(),
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
