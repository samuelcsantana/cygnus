# CLAUDE.md - Frontend React Guidelines for "Meu Neném" (production domain TBD)

This is the React frontend for the `cygnus-api` backend. This document mirrors the backend's `CLAUDE.md` conventions, adapted to a modern React + TypeScript stack.

## 0. What This Application Is

**Meu Neném** ("My Baby") is a mobile-first web app that helps parents track their child's health and development. A parent registers, adds one or more babies, and from there manages, per baby:

- **Vaccines** — a calendar of required/recommended vaccines by age, with pending and overdue status.
- **Appointments** — pediatrician visits: scheduling, doctor/location, notes.
- **Milestones** — developmental milestones (first smile, first steps, first words) as a timeline, optionally with photos and notes.
- **Profile** — the parent's account and the list of babies they manage (a household can have more than one child).

The brand and visual language is **"Meu Neném Soft-Modern"**: a warm, professional, "high-end pediatric" aesthetic — deep teal primary (`#0f5653`), soft neutral surfaces, generous rounded corners, Inter typeface. It deliberately avoids a clinical/cold medical-app feel.

### Design source of truth

- **Figma:** https://www.figma.com/design/oNhnQnvnk4hui83MwonXln/Meu-Nen%C3%A9m-%E2%80%94-Telas — the one and only design reference; no local export of it survives in this repo (see below). Where a screen exists in two versions ("X" and "X (Redesign)"), **the Redesign version is canonical** unless a specific screen is explicitly called out otherwise (e.g. login has historically mixed the original left/brand panel with the redesign's right/form panel — check with the user if a screen has both and it isn't obvious which to use).
- **The Figma MCP server is rate-limited** (Starter plan: 6 tool calls/month at time of writing). Treat every `get_design_context`/`get_screenshot`/`get_variable_defs` call as expensive: batch what you need for a screen into as few calls as possible, and pull the full color/typography/spacing token set **once**, early, and write it straight into the Tailwind `@theme` (Section 3) so it's never re-fetched. If the quota is already exhausted, ask the user for a screenshot/export of the specific screen instead of guessing.
- There is no cached `DESIGN.md` or per-screen `code.html` in this repo (there was, in the previous Angular attempt — it was deleted). The first real task in a fresh session should be pulling the token set from Figma and re-establishing it as a committed source of truth (e.g. a `DESIGN.md` at the repo root) before implementing screens, so it doesn't have to be re-derived screen by screen.

### Lessons from the previous (Angular) attempt — read before implementing a screen

The first version of this app was hand-built in Angular/SCSS, manually re-deriving each design value into rem-based SCSS by eye/memory instead of reading it off the source. This produced visible drift every time (button heights that didn't match surrounding inputs, border/shadow opacity guessed instead of copied, icon sizes defaulting to the wrong value, colors approximated instead of copied) — several rounds of back-and-forth were needed to fix things that only looked right in an isolated screenshot. **Do not repeat this**: with Tailwind actually available, copy class names and arbitrary values from what `get_design_context` returns as literally as possible instead of re-interpreting them, and verify in an actual rendered browser (not just a mental model of the CSS) before calling a screen done. When a reference uses an image asset (real photography) that we don't have the rights/files for, substitute a themed icon or solid treatment and say so — don't invent a stock photo URL.

### Future direction: a React Native app is coming (separate repository)

Once this web app is in good shape, the plan is to build the **same application as a React Native (mobile) app, in its own separate repository** — not a monorepo package of this one. Different toolchains (Vite vs Metro/Expo), independent deploy cadence, and no shared-package tooling to maintain for a payoff that's still hypothetical. This doesn't change anything about how the web app is built today, but it does shape two things worth doing anyway:

- Keep **`lib/`, `hooks/`, and every feature's `api/`** (fetch functions, TanStack Query hooks, Zod schemas/types, business logic) free of DOM/browser-only APIs (`window`, `document`, `localStorage`, etc.) wherever the underlying logic isn't actually web-specific, and decoupled from Tailwind/shadcn — a feature's business logic (what data it needs, what it validates, what it mutates) should read independently of how it's rendered. Nothing will import across repositories, but this keeps the logic easy to *port by hand* into the React Native repo later with minimal translation, and keeps this codebase cleaner regardless.
- The two things that genuinely act as a shared source of truth **across both repositories** are the backend's Swagger contract (`http://localhost:3005/docs`) and the design token sheet re-established per the section above — the React Native repo's NativeWind theme should be generated from the same tokens, the same way this repo's Tailwind theme is (Section 3). Don't set any of that up now; it isn't part of this web app.

## 1. Communication & Language Rules
- **Conversation with User:** ALWAYS communicate, explain, and answer questions in **Portuguese (PT-BR)**.
- **Codebase Language:** All code, component names, variable names, CSS classes, Git commits, documentation, and automated tests MUST be written entirely in **English**. User-facing text (labels, messages) is the only exception — it lives in i18n resource files (Section 7), never hardcoded in JSX.

## 2. Modern React Practices & Architecture
Apply feature-based, pragmatic Clean Architecture principles. Avoid over-engineering (respect KISS and YAGNI).

- **Build tool: Vite.** This is a client-rendered SPA behind auth (no public/SEO-facing pages, every screen needs a logged-in user's private data) deployed as a static build behind Nginx — Next.js's SSR/SSG/ISR value proposition doesn't apply here and would mean either running a Node server in production (a deployment model change) or using Next's static export mode, which gives up most of what Next offers anyway. Vite keeps the dev/build story simple and matches the existing Docker/Nginx deployment approach.
- **React Features (Strict Requirement):**
  - **Function components + hooks only.** No class components, no legacy lifecycle methods.
  - **TypeScript strict mode**, no `any`. Props are typed with explicit `interface`/`type`, never inferred as `any` from untyped JSON.
  - **Server state** (anything from `cygnus-api`) is managed with **TanStack Query** (`useQuery`/`useMutation`) — never fetched in a raw `useEffect` + `useState` pair. It owns caching, loading/error state, and refetching.
  - **Local/global UI state** (form-adjacent state, modal open/closed, active tab) uses plain `useState`/`useReducer` for component-local state, and **Zustand** for the rare cases that need to be shared across distant components (e.g. the currently-selected baby). Don't reach for Zustand for state a single component tree already owns via props.
  - **Forms:** **React Hook Form** + **Zod** schemas for validation, mirroring the backend DTOs' constraints. Every form field is a controlled input registered with RHF; validation errors render inline, never as a browser `alert`.
  - Memoize (`useMemo`/`useCallback`/`React.memo`) only where a measured re-render cost justifies it — don't reflexively wrap every function/value.

- **Architectural Layers & Folder Structure:**
  ```
  src/
  ├── app/            # Router setup, root providers (QueryClient, i18n, theme), route-level layouts
  ├── components/
  │   └── ui/         # shadcn/ui components (generated via CLI — see Section 3), zero business logic
  ├── shared/         # Hand-written reusable components/hooks/utils shared across features, zero business logic
  ├── features/
  │   ├── auth/
  │   ├── babies/
  │   │   ├── api/        # TanStack Query hooks + fetch functions + Zod schemas/types for this feature
  │   │   ├── components/  # Presentational components local to this feature
  │   │   └── routes/       # Routed, "smart" page components — consume api/, compose components/
  │   ├── vaccines/
  │   ├── appointments/
  │   ├── milestones/
  │   └── profile/
  ├── lib/            # api client (fetch wrapper), i18n config, query client config, cn() helper, etc.
  └── hooks/          # Cross-feature reusable hooks
  ```
  Components never call `fetch`/`axios` directly — that stays inside a feature's `api/` folder, exposed as typed query/mutation hooks (e.g. `useBabies()`, `useCreateBaby()`).

## 3. Styling: Tailwind CSS + shadcn/ui
- **Tailwind CSS v4**, configured via `@theme` in the main CSS entry, with tokens (colors, font sizes with paired line-height/weight, radii) pulled from Figma once and committed — see Section 0. This lets classes copied from Figma's design-to-code output (`bg-primary`, `text-headline-lg`, `rounded-xl`, …) resolve correctly by just pasting them in.
- **shadcn/ui** for interactive/complex primitives (dialog, dropdown menu, select, popover, calendar/date picker, tabs, toast). Add components with the CLI (`npx shadcn@latest add <component>`) — they're copied into `src/components/ui/` as editable source, **not** an opaque npm dependency. Customize the copied source directly to match the exact design tokens instead of fighting default shadcn styling with overrides.
- Don't hand-roll accessible behavior (focus trap, roving tabindex, keyboard nav, ARIA wiring) that shadcn/Radix already solves — that was the whole point of picking it over hand-rolled Angular components.
- Icons: **Material Symbols Outlined** (loaded as a webfont, same as the design exports use) so icon names copy directly from `code.html`/Figma without remapping. Don't introduce a second icon set.

## 4. Local Infrastructure & Environment Configuration
- The app runs locally against `cygnus-api` at `http://localhost:3005` and is served on `http://localhost:4205` — set `server.port: 4205` in `vite.config.ts` — matching the backend's `CORS_ORIGIN` (see `cygnus-api/.env`).
- All environment-dependent values (API base URL, feature flags) live in `.env` / `.env.production` files read via Vite's `import.meta.env` (vars prefixed `VITE_`), exposed through a single typed `src/lib/config.ts`. The production API URL is not defined yet (domain not registered) — leave it as a clearly marked placeholder until launch. Never hardcode URLs in components or API hooks.
- Provide a multi-stage `Dockerfile` (Node build → Nginx serve) and a `docker-compose.yml` entry so the frontend runs alongside the backend's own compose setup for full-stack local development.

## 5. API Integration (Swagger / OpenAPI)
- **The Contract Source of Truth:** the backend exposes complete Swagger/OpenAPI documentation (`http://localhost:3005/docs`). ALWAYS consult it to generate exact TypeScript types (and matching Zod schemas) before implementing HTTP calls — never guess payload shapes.
- Types/schemas live in `lib/types` (cross-feature) or `features/[name]/api/models.ts` (feature-specific), mirroring the backend's DTOs. Avoid `any`.
- All HTTP calls are isolated inside a feature's `api/` folder (fetch functions wrapped by TanStack Query hooks) — never inline in components.

## 6. Security First & Authentication Integration
- **HTTP-Only Cookie Authentication:** the backend issues JWT Access + Refresh tokens as HTTP-Only, Secure, SameSite=Strict cookies (`access_token`, `refresh_token`) on `/auth/login`. NEVER read, store, or manage JWTs in `localStorage`/`sessionStorage` — the browser handles the cookie transparently.
- **No silent-refresh yet:** the backend does not expose an `/auth/refresh` endpoint yet — only `register`, `login`, and `logout`. Do not build a refresh flow against an endpoint that doesn't exist; until it ships, treat the access token's `15m` expiry (`JWT_ACCESS_EXPIRES_IN`) as a hard session limit and redirect to login on `401`.
- **HTTP client:** the shared fetch wrapper in `lib/` ALWAYS sends `credentials: 'include'`, and attaches a CSRF header if the backend requires one alongside the cookie. A `401` response triggers a redirect to `/login` (e.g. via a TanStack Query global error handler), not a silent retry loop.
- **Route protection:** protected routes are wrapped by an auth-check layout/loader (React Router) that redirects unauthenticated users to `/login` before rendering.
- **XSS Protection:** never use `dangerouslySetInnerHTML` unless explicitly justified and reviewed; React's default JSX escaping is the norm.
- **Secrets:** no API keys, tokens, or credentials hardcoded in source — only non-sensitive config (API base URL) belongs in `.env`.

## 7. UI/UX, Responsiveness & Accessibility (a11y)
- **Mobile-first:** write Tailwind classes starting from the mobile layout, adding `sm:`/`md:`/`lg:` variants for larger screens — never the reverse. This app is used heavily by parents on their phones.
- **Responsive data tables:** a traditional `<table>` breaks on small screens. Below the relevant breakpoint, switch to a list/card pattern — each row becomes a card with stacked label/value pairs — instead of letting the table overflow or force horizontal scroll.
- **Semantic HTML first:** prefer `<nav>`, `<main>`, `<button>`, `<label>` over generic `<div>`/`<span>` with `onClick` — a clickable `div` isn't focusable or announced by screen readers without extra work.
- **ARIA where semantics fall short:** `aria-label` on icon-only buttons, `role` on custom components, `aria-live` on dynamically updating regions (e.g., save confirmations), `aria-expanded`/`aria-hidden` on collapsible elements. shadcn/Radix components already handle this for the primitives they cover.
- **Keyboard navigation:** every interactive element must be reachable via `Tab` in logical order. Avoid positive `tabIndex`; use `tabIndex={0}` only to make non-native elements focusable, `tabIndex={-1}` to remove from tab order without hiding from the DOM.
- **Forms:** every input has an associated `<label>`, error messages are linked via `aria-describedby`, and error state never relies on color alone.

## 8. Internationalization (i18n)
- The app ships with **Portuguese (Brazil) as the default locale**, with English and Spanish supported from the start — no user-facing string is hardcoded in a component.
- Use **`react-i18next`** — translation keys via the `useTranslation` hook / `<Trans>` component (e.g., `t('appointments.title')`), never literal text in JSX.
- Resource files: `src/locales/pt-BR.json`, `en.json`, `es.json` — every key filled in all three locales, no empty placeholders.
- Does not apply to code identifiers (variables, function names) — only to text the end user sees.

## 9. Git Workflow (Gitflow + Semantic & Atomic Commits + Single Authorship)
- Maintain strict branch separation: `main` (production), `develop` (staging), and feature branches (`feature/name-of-feature`).
- **Semantic Commits:** Strictly follow the **Conventional Commits** specification in English (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`).
- **Atomic Commits:** Every commit MUST represent a single, indivisible logical unit of work that compiles and passes tests independently. Never bundle unrelated changes (e.g., a new UI component + refactoring an unrelated global hook) into one commit.
- **Strict Single Authorship (No Co-authors):** NEVER add `Co-authored-by:` trailers, AI tool attributions, or any other co-author tags in Git commit messages.
- **Squash and Merge Readiness:** keep feature branches clean and cohesive so they squash seamlessly into `develop`/`main` without losing historical context.

## 10. Pragmatic Testing Strategy
- **Unit & Component Tests:** **Vitest** + **React Testing Library**. Test component behavior (rendering on state/query changes, user interactions via `@testing-library/user-event`) and `api/` hook logic — mock the network layer (e.g. MSW), never hit a real backend.
- **What to cover:** feature state transformations and edge cases (e.g., displaying delayed-vaccine warnings correctly, rejecting a future birth date, rendering error state on a failed API call) — not React's own framework boilerplate, and not shadcn/Radix's already-tested internals.
- **E2E Tests:** reserve Playwright for critical end-user journeys (login, add baby, log vaccine, schedule appointment) running against a locally built app + the dockerized backend. Avoid writing E2E tests for basic component rendering — that belongs in component tests.
