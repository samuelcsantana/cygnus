import { mergeConfig, defineConfig as defineVitestConfig } from 'vitest/config'

import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineVitestConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      // Pinned, and it is not cosmetic: this suite runs in the developer's zone
      // locally (UTC-3) and in **UTC** on the runner, so a date test can pass in
      // one and be inert in the other. Two bugs found on 06/09/2026 were exactly
      // that shape — `new Date('2026-01-15')` is a UTC instant read with local
      // getters, and a visit's UTC date is a different day from its local one —
      // and **neither is reproducible at offset zero**. Every user of this app
      // is in a negative offset; the tests should be too.
      env: { TZ: 'America/Sao_Paulo' },
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text-summary', 'html', 'json-summary', 'lcov'],
        // Include unimported production modules so the denominator is honest.
        include: ['src/**/*.{ts,tsx}', 'embed/**/*.ts', 'mf/**/*.{ts,tsx}'],
        exclude: [
          '**/*.d.ts',
          '**/*.{test,spec,stories}.{ts,tsx}',
          '**/__tests__/**',
          'src/test/**',
        ],
      },
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
