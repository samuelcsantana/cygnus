# Ninho

[![Latest release](https://img.shields.io/github/v/release/samuelcsantana/cygnus?label=release)](https://github.com/samuelcsantana/cygnus/releases/latest)
[![CI](https://github.com/samuelcsantana/cygnus/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/samuelcsantana/cygnus/actions/workflows/ci.yml)
[![Storybook deployment](https://github.com/samuelcsantana/cygnus/actions/workflows/storybook.yml/badge.svg?branch=main)](https://samuelcsantana.github.io/cygnus/)
[![MIT License](https://img.shields.io/github/license/samuelcsantana/cygnus)](LICENSE)
[![Unit test line coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fsamuelcsantana.github.io%2Fcygnus%2Fcoverage%2Fbadge.json)](https://samuelcsantana.github.io/cygnus/coverage/)

![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

A mobile-first web application for families to track their children's health and development. **Ninho** is the product name; **Cygnus** identifies this repository and its integrations.

[Live application](https://cygnus.samuelsantana.dev) · [Design system](https://samuelcsantana.github.io/cygnus/) · [Backend](https://github.com/samuelcsantana/cygnus-api) · [MIT License](LICENSE)

## Features

- Registration, password or Google sign-in, and account recovery.
- Child profiles and shared access for guardians.
- Vaccination schedules, appointments, medications, and a professional directory.
- Growth measurements, WHO reference ranges, and developmental milestones.
- Health plans, search, and notifications.
- Terms of Use, Privacy Policy, and versioned acceptance records.
- Portuguese, English, and Spanish interfaces; light and dark themes.

Ninho organizes information and does not replace advice from healthcare professionals. The web application relies on the API for family records. Its cache does not provide complete offline storage of those records.

## Stack

React 19, Vite 8, and strict TypeScript; TanStack Query for server state; React Hook Form and Zod for forms; Zustand for shared UI state; Tailwind CSS v4, shadcn/ui, and Radix; i18next for localization.

Vitest, Testing Library, and MSW cover application tests. Storybook documents components and checks interactions and accessibility. Playwright covers browser journeys.

## Local development

Use Node.js 24 and npm. Start the separate backend, normally at `http://localhost:3005`, following the [cygnus-api instructions](https://github.com/samuelcsantana/cygnus-api).

```bash
npm ci
npm run dev
```

The frontend runs at `http://localhost:4205`. To configure the API, create a `.env.local` file with `VITE_API_BASE_URL`. Variables prefixed with `VITE_*` are public and compiled into the build: never put secrets in them. Google credentials belong in the backend.

### Docker

```bash
docker compose up -d --build web
```

Nginx serves the static build on port 4205 without hot reload. Rebuild the service after changes. Docker and Vite use the same port, so run only one of them on it. Compose does not start the backend; set `VITE_API_BASE_URL` as a build argument when needed.

## Validation

| Command | Purpose |
| --- | --- |
| `npm run lint` | Lint with oxlint |
| `npx tsc -b` | Typecheck the application, stories, and integrations |
| `npm test` | Unit and component tests |
| `npm run test:coverage` | V8 coverage, HTML report, and metrics summary |
| `npm run contract:check` | Check mapped endpoint contracts against OpenAPI |
| `npm run test:storybook` | Stories, interactions, and axe checks in Chromium |
| `npm run test:e2e` | Playwright journeys against running services |
| `npm run build` | Typecheck, application, embed, and Module Federation |
| `npm run storybook` | Design system on port 6006 |
| `npm run build-storybook` | Static design system in `storybook-static/` |
| `npm run preview` | Preview the build locally |

Install the test browser with `npx playwright install chromium`. Read the [E2E instructions](e2e/README.md) before running tests that create data.

CI checks lint, types, contracts, unit tests, the build, and Storybook. E2E runs separately. The contract checker covers an explicit endpoint map; axe does not replace a manual accessibility assessment.

The [public coverage report](https://samuelcsantana.github.io/cygnus/coverage/) shows lines, statements, functions, and branches exercised by unit and component tests. The badge displays line coverage from the latest successful Pages publication. The report includes TypeScript modules in `src/`, `embed/`, and `mf/`, even when tests do not import them; it excludes type declarations, tests, stories, and test infrastructure. Storybook and E2E checks are separate and do not contribute to this percentage. CI also retains the report as an artifact for 14 days. No minimum coverage threshold is enforced for this initial baseline.

## Structure and design system

| Directory | Responsibility |
| --- | --- |
| `src/app/` | Routes, providers, and layouts |
| `src/features/` | Domains, APIs, schemas, hooks, and pages |
| `src/components/ui/` | UI primitives |
| `src/shared/`, `src/hooks/`, `src/lib/` | Reusable components and infrastructure |
| `src/locales/` | Brazilian Portuguese, English, and Spanish copy |
| `src/docs/` | Storybook pages |
| `e2e/` | Playwright journeys and fixtures |

Design tokens live in `src/index.css`. Stories sit beside their components; configuration lives in `.storybook/`. The suite treats accessibility violations as errors. The `storybook.yml` workflow publishes the design system from `main` to GitHub Pages.

## Build and deployment

Three artifacts share the production build:

| Artifact | Public entry point | Documentation |
| --- | --- | --- |
| React application | `/` | This README |
| Standalone widget | `/embed/embed.js`, `/embed/iframe.html` | [Embed](embed/README.md) |
| Module Federation | `/mf/remoteEntry.js` | [Module Federation](mf/README.md) |

Preserve the Cygnus URLs and technical identifiers used by external consumers. Stable entry points need short caching or revalidation; hashed assets can use immutable caching.

The Vercel configuration proxies `/api/*` and `/uploads/*` to the backend on Render. Changes to `main` trigger deployment. Docker uses Nginx with its own header and cache configuration. To check static serving after changes:

```bash
node scripts/check-static-serving.mjs
node scripts/check-static-serving.mjs --browser
```

Set `STATIC_BASE_URL` to check another target. The second check requires Chromium and API access.

## Terms and privacy

The documents are available at the public [Terms of Use](https://cygnus.samuelsantana.dev/termos) and [Privacy Policy](https://cygnus.samuelsantana.dev/privacidade) routes. Content lives in `src/features/legal/content/`; version, status, and effective date are defined in `src/shared/legal.ts`. Local changes appear on the website after deployment.

The Android application with local data storage is planned separately and is not delivered by this repository.

## License and contact

Code is distributed under the [MIT License](LICENSE), copyright © 2026 Samuel Santana. Dependencies and third-party materials remain subject to their respective licenses.

Maintainer: Samuel Santana — [samuel.ssa89@gmail.com](mailto:samuel.ssa89@gmail.com).
