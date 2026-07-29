# CLAUDE.md - Frontend Angular Guidelines for "Cygnus" (production domain TBD)

This is the Angular frontend for the `cygnus-api` backend. This document mirrors the backend's `CLAUDE.md` conventions, adapted to modern Angular best practices.

## 1. Communication & Language Rules
- **Conversation with User:** ALWAYS communicate, explain, and answer questions in **Portuguese (PT-BR)**.
- **Codebase Language:** All code, component names, variable names, CSS classes, Git commits, documentation, and automated tests MUST be written entirely in **English**. User-facing text (labels, messages) is the only exception — it lives in i18n resource files (Section 7), never hardcoded in templates.

## 2. Modern Angular Practices & Architecture
Apply feature-based, pragmatic Clean Architecture principles tailored for modern Angular. Avoid over-engineering (respect KISS and YAGNI).

- **Modern Angular Features (Strict Requirement):**
  - Use **Standalone Components, Directives, and Pipes ONLY** — no `NgModules`.
  - Use **Signals** (`signal`, `computed`, `effect`, `input()`, `output()`, `model()`) for local and global state and reactivity. Use RxJS only for genuinely complex async streams (HTTP requests, websockets, debounce). A one-shot `Observable` the template just reads gets converted with `toSignal()`, never left as a manual subscription.
  - Every component is `ChangeDetectionStrategy.OnPush` — Signals already make change detection granular, so `Default` throws that gain away.
  - Use the built-in **Control Flow** syntax (`@if`, `@for` with `track`, `@switch`, `@empty`) instead of structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`).
  - Use **Deferrable Views** (`@defer`, `@loading`, `@placeholder`) to optimize initial bundle size and lazy-load heavy, below-the-fold components.
  - Apply **typed Reactive Forms** for all user inputs and validations — avoid template-driven forms.

- **Architectural Layers & Folder Structure:**
  ```
  src/app/
  ├── core/        # Singletons: HTTP interceptors, auth guards, global domain types (loaded once, never from a lazy feature)
  ├── shared/       # Reusable UI (buttons, modals, cards), pipes, directives — zero business logic
  ├── features/
  │   ├── auth/
  │   ├── babies/
  │   │   ├── data-access/  # HTTP services + Signal Store/service exposing state
  │   │   ├── feature/       # Smart, routed components — consume data-access, delegate actions back to it
  │   │   └── ui/             # Presentational components local to this feature
  │   ├── vaccines/
  │   ├── appointments/
  │   ├── milestones/
  │   └── notifications/
  └── layout/       # Shell, navbar, app-level layout
  ```
  Each feature is lazy-loaded (`loadComponent`/`loadChildren`) and owns its UI, state (Signals, optionally via `@ngrx/signals` Signal Store for non-trivial features), and data integration. Components never call `HttpClient` directly — that stays inside `data-access` services.

## 3. Local Infrastructure & Environment Configuration
- The app runs locally against `cygnus-api` at `http://localhost:3005` and is served on `http://localhost:4205`, matching the backend's `CORS_ORIGIN` (see `cygnus-api/.env`).
- All environment-dependent values (API base URL, feature flags) live in `src/environments/environment.ts` (dev) and `environment.prod.ts` (prod). The production API URL is not defined yet (domain not registered) — leave it as a clearly marked placeholder until launch. Never hardcode URLs in services or components.
- Provide a multi-stage `Dockerfile` (Node build → Nginx serve) and a `docker-compose.yml` entry so the frontend runs alongside the backend's own compose setup for full-stack local development.

## 4. API Integration (Swagger / OpenAPI)
- **The Contract Source of Truth:** the backend exposes complete Swagger/OpenAPI documentation (`http://localhost:3005/docs`). ALWAYS consult it to generate exact TypeScript interfaces/models before implementing HTTP calls — never guess payload shapes.
- Models live in `core/models` (cross-feature) or `features/[name]/data-access/models` (feature-specific), mirroring the backend's DTOs. Avoid `any`.
- All HTTP calls are isolated inside `data-access` services — never in components or `shared` UI.

## 5. Security First & Authentication Integration
- **HTTP-Only Cookie Authentication:** the backend issues JWT Access + Refresh tokens as HTTP-Only, Secure, SameSite=Strict cookies (`access_token`, `refresh_token`) on `/auth/login`. NEVER read, store, or manage JWTs in `localStorage`/`sessionStorage` — the browser handles the cookie transparently.
- **No silent-refresh yet:** the backend does not expose an `/auth/refresh` endpoint yet — only `register`, `login`, and `logout`. Do not build a refresh interceptor against an endpoint that doesn't exist; until it ships, treat the access token's `15m` expiry (`JWT_ACCESS_EXPIRES_IN`) as a hard session limit and redirect to login on `401`.
- **HTTP Client Configuration:** configure `provideHttpClient(withInterceptors([...]))` to ALWAYS send `withCredentials: true`, plus `withXsrfConfiguration` if the backend requires a CSRF header alongside the cookie.
- **Route protection:** a functional `CanActivateFn` auth guard checks session state before allowing access to protected routes.
- **XSS Protection:** rely on Angular's built-in DOM sanitization. NEVER use `bypassSecurityTrustHtml`/`bypassSecurityTrustScript` unless explicitly justified and reviewed.
- **Secrets:** no API keys, tokens, or credentials hardcoded in source — only non-sensitive config (API base URL) belongs in `environment.ts`.

## 6. UI/UX, Responsiveness & Accessibility (a11y)
- **Mobile-first:** write styles starting from the mobile layout, adding rules for larger screens via `min-width` breakpoints — never the reverse. This app is used heavily by parents on their phones.
- **Responsive data tables:** a traditional `<table>` breaks on small screens. Below the relevant breakpoint, switch to a list/card pattern — each row becomes a card with stacked label/value pairs — instead of letting the table overflow or force horizontal scroll.
- **Semantic HTML first:** prefer `<nav>`, `<main>`, `<button>`, `<label>` over generic `<div>`/`<span>` with `(click)` — a clickable `div` isn't focusable or announced by screen readers without extra work.
- **ARIA where semantics fall short:** `aria-label` on icon-only buttons, `role` on custom components, `aria-live` on dynamically updating regions (e.g., save confirmations), `aria-expanded`/`aria-hidden` on collapsible elements.
- **Keyboard navigation:** every interactive element must be reachable via `Tab` in logical order. Avoid positive `tabindex`; use `tabindex="0"` only to make non-native elements focusable, `tabindex="-1"` to remove from tab order without hiding from the DOM.
- **Forms:** every input has an associated `<label>`, error messages are linked via `aria-describedby`, and error state never relies on color alone.

## 7. Internationalization (i18n)
- The app ships with **Portuguese (Brazil) as the default locale**, with English and Spanish supported from the start — no user-facing string is hardcoded in a template.
- Use `@ngx-translate/core` (or `@angular/localize` if the project later needs build-time locale bundles) — translation keys via the `translate` pipe/directive (e.g., `{{ 'appointments.title' | translate }}`), never literal text in templates.
- Resource files: `src/assets/i18n/pt-BR.json`, `en.json`, `es.json` — every key filled in all three locales, no empty placeholders.
- Does not apply to code identifiers (variables, function names) — only to text the end user sees.

## 8. Git Workflow (Gitflow + Semantic & Atomic Commits + Single Authorship)
- Maintain strict branch separation: `main` (production), `develop` (staging), and feature branches (`feature/name-of-feature`).
- **Semantic Commits:** Strictly follow the **Conventional Commits** specification in English (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`).
- **Atomic Commits:** Every commit MUST represent a single, indivisible logical unit of work that compiles and passes tests independently. Never bundle unrelated changes (e.g., a new UI component + refactoring an unrelated global service) into one commit.
- **Strict Single Authorship (No Co-authors):** NEVER add `Co-authored-by:` trailers, AI tool attributions, or any other co-author tags in Git commit messages.
- **Squash and Merge Readiness:** keep feature branches clean and cohesive so they squash seamlessly into `develop`/`main` without losing historical context.

## 9. Pragmatic Testing Strategy
- **Unit & Component Tests:** use modern Angular testing tools (Jest or Vitest, not Karma/Jasmine). Test component behavior (DOM rendering on Signal updates) and `data-access` service logic — mock `HttpClient` (`HttpTestingController` or a fake), never hit a real backend.
- **What to cover:** feature state transformations and edge cases (e.g., displaying delayed-vaccine warnings correctly, rejecting a future birth date, rendering error state on a failed API call) — not Angular's own framework boilerplate.
- **E2E Tests:** reserve Playwright/Cypress for critical end-user journeys (login, add baby, log vaccine, schedule appointment) running against a locally built app + the dockerized backend. Avoid writing E2E tests for basic component rendering — that belongs in component tests.
