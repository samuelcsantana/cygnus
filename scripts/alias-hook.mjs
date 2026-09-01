/**
 * Resolves the `@/` alias to `src/` when a script here imports app code
 * directly.
 *
 * The alias exists in tsconfig and in Vite; Node knows nothing about it, and
 * without this any import of a `*.schemas.ts` dies with
 * `Cannot find package '@/lib'`. Registering a hook is more honest than
 * duplicating the schemas here just to be able to read them — duplication is
 * the very problem `contract-drift.mjs` exists to find.
 */
const ROOT = new URL('../src/', import.meta.url)

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    const withoutAlias = specifier.slice(2)
    // The app imports without an extension; Node requires one. **The `await` on
    // each attempt is the detail that matters:** `next` is async, so a
    // synchronous try/catch accepts the first promise and only learns of the
    // failure after it has already returned — the fallback never runs.
    const candidates = [`${withoutAlias}.ts`, `${withoutAlias}/index.ts`, withoutAlias]
    for (const candidate of candidates) {
      try {
        return await next(new URL(candidate, ROOT).href, context)
      } catch {
        // try the next candidate
      }
    }
  }
  return next(specifier, context)
}
