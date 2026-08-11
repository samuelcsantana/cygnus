import { mergeConfig, defineConfig as defineVitestConfig } from 'vitest/config'

import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineVitestConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      // e2e/ holds Playwright specs (a different test runner, real browser,
      // no jsdom) — Vitest's default glob would otherwise also pick them up.
      exclude: ['**/node_modules/**', '**/.git/**', 'e2e/**'],
      // The default 5000ms per-test timeout is tight on a contended CI
      // runner for tests that await async react-hook-form validation; raise
      // it well above the testing-library asyncUtilTimeout below (see
      // setup.ts) so a genuinely-stuck assertion fails with testing-library's
      // informative error instead of vitest's generic "Test timed out".
      testTimeout: 15000,
    },
  }),
)
