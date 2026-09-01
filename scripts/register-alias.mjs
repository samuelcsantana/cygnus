import { register } from 'node:module'

/**
 * Entry point for `node --import`: turns on the hook that resolves `@/` to
 * `src/`. Wired into `npm run contract:check`.
 */
register('./alias-hook.mjs', import.meta.url)
