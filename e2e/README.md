# E2E tests (Playwright)

Covers the critical end-user journeys named in `AGENTS.md` Section 10:
register + log in, add a baby, log a vaccine as applied, schedule an
appointment. Everything else stays in Vitest/RTL component tests.

## Running

These tests hit a real, already-running stack over HTTP — Playwright does
**not** start anything for you (`playwright.config.ts` has no `webServer`
entry on purpose, since the backend lives in the separate `cygnus-api`
repository).

1. Start `cygnus-api`'s own stack (Postgres + Redis + API) — see that
   repo's `docker-compose.yml`.
2. Start this repo's frontend: `docker compose up -d --build web` (serves
   the production build via Nginx on `:4205`), or `npm run dev` for a
   faster inner loop against `:4205`.
3. `npm run test:e2e`

Override the target URL with `E2E_BASE_URL` if the frontend isn't on the
default `http://localhost:4205`.

## Notes

- Each spec registers its own fresh user (`support/fixtures.ts` generates a
  unique email per run) — no shared fixtures/seed data, so specs are safe
  to run in parallel and repeatedly against the same database.
- Locale is pinned to `pt-BR` in `playwright.config.ts`, matching the
  app's default — selectors use the literal Portuguese copy.
