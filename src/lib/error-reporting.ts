import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

/**
 * No-ops until VITE_SENTRY_DSN is set (local builds have no DSN).
 * Call once, before the app renders.
 */
export function initErrorReporting(): void {
  if (!dsn) return

  Sentry.init({
    dsn,
    integrations: [
      // Not a default integration: getDefaultIntegrations() ships InboundFilters,
      // GlobalHandlers, Breadcrumbs and friends, but no tracing. Without this the
      // SDK reports errors and silently produces no spans — so tracesSampleRate
      // alone measured nothing. This is also what records the Web Vitals
      // (LCP, CLS, INP, TTFB, FCP) as measurements on the pageload span.
      //
      // It costs 19 kB gzip on the entry chunk (119 → 138 kB, measured), which
      // lands on the critical path and therefore worsens the very LCP it
      // reports. Accepted: an unmeasured LCP cannot be improved, and the
      // alternative that is cheap (the web-vitals package, ~2 kB) reports the
      // numbers without the pageload span that says which request caused them.
      Sentry.browserTracingIntegration(),
    ],
    // The site gets portfolio-scale traffic. At 0.1 a whole day can pass with no
    // sampled pageload, which reads as "no data" rather than "no traffic" and
    // makes the numbers untrustworthy. Revisit if volume ever justifies it.
    tracesSampleRate: 1.0,
    // Same-origin only. The API is reached through a proxy at /api/*, so it is
    // same-origin too. This matters because photoUrl and avatarUrl accept any
    // host by design — without a list, trace headers would ride along to
    // whatever third party a user pasted in.
    tracePropagationTargets: [/^\//],
  })
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
