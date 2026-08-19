import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

/**
 * No-ops until VITE_SENTRY_DSN is set (there is no Sentry project yet).
 * Call once, before the app renders.
 */
export function initErrorReporting(): void {
  if (!dsn) return
  Sentry.init({ dsn, tracesSampleRate: 0.1 })
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (dsn) {
    Sentry.captureException(error, { extra: context })
    return
  }
  if (import.meta.env.DEV) {
    console.error('[error-reporting]', error, context)
  }
}
