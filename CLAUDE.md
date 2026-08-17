# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Meu Neném** ("My Baby") — mobile-first React SPA that helps parents track a child's health and
development: vaccines (due/overdue calendar), pediatrician appointments, developmental milestones,
and a household of one or more babies per parent account. Client-rendered only (no SSR/SEO
surface — every screen is behind auth), built with Vite, deployed as a static build behind Nginx.

It consumes `cygnus-api`, a **separate backend repository** (not in this repo). The backend must be
running and reachable (default `http://localhost:3005`) for the app to do anything beyond render
empty/login screens. The backend's Swagger docs (`http://localhost:3005/docs`, dev-only) are the
contract source of truth for request/response shapes — types and Zod schemas in this repo mirror
the backend's DTOs by hand; there is no codegen step.

Full conventions (architecture, styling, i18n, auth, git workflow, testing strategy) live in
**`AGENTS.md`** at the repo root — read it before making non-trivial changes; this file summarizes
and complements it rather than repeating it in full. Design tokens (colors, typography, radii) are
committed in **`DESIGN.md`** — copy values from there literally rather than re-deriving them.

## Commands

```bash
npm run dev              # dev server, http://localhost:4205 (port is fixed/strict in vite.config.ts)
npm run build             # tsc -b (typecheck) + vite build -> dist/
npm run preview           # serve the production build locally
npm run lint               # oxlint

npm run test               # vitest run (single pass, CI-style)
npm run test:watch         # vitest watch mode
npx vitest run path/to/file.test.ts            # run one test file
npx vitest run -t "test name substring"         # run tests matching a name

npm run test:e2e                          # playwright test (see below — needs a running stack)
npx playwright test e2e/login.spec.ts      # single e2e spec

npm run storybook          # Storybook dev server, :6006
npm run build-storybook    # static Storybook build -> storybook-static/
npm run test:storybook     # every story run as a test (interaction + axe a11y)
```

Docker (frontend only — no backend service defined in `docker-compose.yml`; point
`VITE_API_BASE_URL` build arg at wherever `cygnus-api` is running):
```bash
docker compose up -d --build
```

**E2E tests hit a real stack** — Playwright does not start anything (`playwright.config.ts` has no
`webServer`). Start `cygnus-api`'s docker-compose stack (Postgres + Redis + API) separately, then
either `npm run dev` or `docker compose up -d --build web` for this repo, then `npm run test:e2e`.
Override the target with `E2E_BASE_URL`. Each spec registers its own fresh user, so specs are
parallel-safe against a shared database. Locale is pinned to `pt-BR`; selectors use literal
Portuguese copy.

Path alias: `@/*` → `src/*` (defined in both `vite.config.ts` and `tsconfig.app.json` — keep them
in sync if it ever changes).

## Architecture

Feature-based structure; each feature is close to a self-contained vertical slice:

```
src/
├── app/            # Router (react-router-dom, lazy-loaded routes), root providers, layouts
├── components/ui/  # shadcn/ui primitives — generated via CLI, no business logic, edit in place
├── shared/         # Hand-written components/hooks/utils/icons reused across features
├── features/<name>/
│   ├── api/        # fetch functions + TanStack Query hooks + Zod schemas/types
│   ├── components/ # presentational components local to the feature
│   └── routes/     # routed "smart" pages — compose api/ + components/
├── lib/            # http client, config, i18n, query client, date/cookie utils
├── hooks/          # cross-feature reusable hooks
└── locales/        # pt-BR.json (default), en.json, es.json
```

Features: `auth`, `babies` (+ household invites), `vaccines`, `appointments`, `milestones`,
`notifications`, `profile`.

**Data flow / state model:**
- Server state is *only* handled through TanStack Query hooks in each feature's `api/` folder —
  components never call `fetch` directly. `src/lib/http-client.ts` is the single fetch wrapper all
  of those hooks go through.
- `src/lib/query-client.ts` centralizes cross-cutting query behavior: no retry on 401/404,
  retry-twice otherwise, and a `QueryCache`/`MutationCache` `onError` that calls an injectable
  `unauthorizedHandler` on any 401. `AppProviders.tsx` is what injects the actual
  `window.location.assign('/login')` behavior — `lib/` itself stays free of DOM APIs so the same
  logic could be ported to a future React Native app by hand.
- Local/ephemeral UI state uses plain `useState`/`useReducer`. Zustand (`src/shared/stores/`) is
  reserved for state genuinely shared across distant components (e.g. a dialog opened from both
  the top nav and the profile page) — there's deliberately no global "selected baby" store; every
  screen shows the whole household at once, tagged per-item with a small avatar.

**Auth (cookie-based, not token-in-JS):**
- The backend issues JWT access/refresh as HttpOnly, Secure, SameSite=Strict cookies on login.
  Nothing in this repo reads or stores a JWT — the browser sends cookies automatically
  (`credentials: 'include'` on every request in `http-client.ts`).
- On a 401, `http-client.ts` calls `POST /auth/refresh` exactly once and retries the original
  request once; concurrent 401s share a single in-flight refresh (`refreshPromise`) instead of each
  firing their own refresh call. `/auth/login` and `/auth/refresh` themselves are exempt from this
  retry (would be meaningless or recursive). If refresh fails, the query-client's unauthorized
  handler redirects to `/login`.
- CSRF uses a double-submit cookie: backend sets a readable `csrf_token` cookie; `http-client.ts`
  echoes it back as `X-CSRF-Token` on mutating requests (POST/PATCH/PUT/DELETE) only. Non-JSON
  callers (e.g. `lib/upload.ts` multipart uploads) reuse the exported `csrfHeaders()`/
  `refreshSession()` helpers rather than duplicating this logic — keep it that way if you add
  another non-JSON call path.
- Route protection is a layout wrapper (`app/routes/ProtectedLayout.tsx`), not a per-page check.

**Routing:** `src/app/router.tsx` uses `react-router-dom`'s `createBrowserRouter` with every
feature route lazy-loaded (`lazy: () => import(...)`) for code splitting — adding a new top-level
page means adding both the route file and a `lazy` entry here, nested under `ProtectedLayout` >
`AppShellLayout` unless it must be reachable while logged out (see `/invites/:code`, which
intentionally sits outside `ProtectedLayout` because the invite preview renders for logged-out
visitors too).

**Styling:** Tailwind CSS v4 via `@theme` (no `tailwind.config.js`), tokens sourced from Figma and
committed in `DESIGN.md`/`src/index.css` — paste class names/values from there rather than
re-deriving. shadcn/ui components in `src/components/ui/` are vendored source (via
`npx shadcn@latest add <component>`), not an npm dependency — customize them directly instead of
overriding from outside. Icons are hand-built SVGs in `src/shared/icons/`, one component per icon
sharing an `IconBase` wrapper — no icon font/second icon library.

**i18n:** `react-i18next`, pt-BR default, en/es supported. No user-facing string is hardcoded in
JSX — always a `t('namespace.key')` lookup, with the key present in all three locale files.

**Testing setup:** Vitest + Testing Library + MSW (`src/test/msw/`) for component/hook tests, mocking
the network layer rather than hitting a real backend. Storybook stories double as tests: axe a11y
runs on every story (`parameters.a11y.test = 'error'` — failing AA is a build failure, not a
warning; known/tracked exceptions are enumerated in `src/test/a11y-known-issues.ts`), and stories
with a `play` function are interaction tests (dialogs, keyboard nav, form input) that run headless
in CI. Playwright is reserved for the handful of critical end-to-end journeys (register/login, add
baby, log vaccine, schedule appointment) — don't add e2e coverage for things a component test
already covers.

## Conventions worth knowing before editing

- Conversation with the user happens in Portuguese (PT-BR); all code, identifiers, commit messages,
  and comments are in English. User-facing text is the sole exception, and it lives only in
  `src/locales/*.json`, never inline in JSX.
- Mobile-first Tailwind: base classes target mobile, `sm:`/`md:`/`lg:` add larger-screen variants —
  never the reverse.
- Git: Gitflow (`main`/`develop`/`feature/*`), Conventional Commits, atomic commits, **no
  `Co-authored-by:` trailers or AI attribution in commit messages**.
- A React Native port (separate repo) is a future direction — keep `lib/`, `hooks/`, and each
  feature's `api/` free of DOM-only APIs (`window`, `document`, `localStorage`) where the
  underlying logic isn't actually web-specific, so business logic stays portable by hand later.
