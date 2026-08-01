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
