import { defineConfig, devices } from '@playwright/test'

/**
 * Runs against an already-running stack, not one Playwright spins up itself:
 * this repo's `web` service plus the separate cygnus-api repo's own
 * docker-compose stack (api + postgres + redis). There is no `webServer`
 * entry here on purpose — cygnus-api lives in a different repository, so
 * Playwright has no way to start it. See e2e/README.md for the exact steps.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Four, not one per core. Every spec signs a user up, and the API is one Node process hashing
  // passwords with bcrypt on libuv's four threads: with ten workers on a 20-core machine sign-ups
  // queued, sign-up took up to 7.8 s and three long journeys passed their 30 s budget. With four,
  // the 29 tests ran green in under a minute (2026-10-13).
  workers: 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4205',
    locale: 'pt-BR',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
