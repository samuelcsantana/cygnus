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
    },
  }),
)
