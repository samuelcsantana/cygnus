import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/dom'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { server } from './msw/server'

// The default 1000ms `waitFor`/`findBy*` timeout is tight for async
// react-hook-form validation (zodResolver) on a shared/throttled CI runner —
// it's comfortably under budget locally but flaked intermittently in CI.
// Kept below vitest's own `testTimeout` (vitest.config.ts) so a genuinely
// stuck assertion fails with testing-library's descriptive error instead of
// vitest's generic "Test timed out".
configure({ asyncUtilTimeout: 8000 })

// jsdom doesn't implement ResizeObserver; several Radix primitives (Select,
// RadioGroup) call it on mount.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => server.close())
