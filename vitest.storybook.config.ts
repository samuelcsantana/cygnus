import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config.ts'

/**
 * Runs every story as a test in a real headless Chromium:
 *
 * - a story that throws on render fails the run (smoke test),
 * - every `play` function runs and its assertions are enforced (interaction test),
 * - `parameters.a11y.test = 'error'` in `.storybook/preview.tsx` turns any axe
 *   violation into a failure (accessibility test).
 *
 * Kept in its own config, separate from `vitest.config.ts`, because this suite
 * needs a downloaded browser (`npx playwright install chromium`) while the
 * jsdom unit suite does not — `npm test` must stay runnable on a fresh clone.
 *
 * There is no setup file: since Storybook 10.3 the addon applies the
 * `.storybook/preview.tsx` annotations (providers, i18n, theme, a11y
 * parameters) to the test run on its own, so the stories run here in the same
 * environment they render in the Storybook UI.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [storybookTest({ configDir: '.storybook' })],
    test: {
      name: 'storybook',
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        instances: [{ browser: 'chromium' }],
      },
    },
  }),
)
