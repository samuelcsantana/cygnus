# E2E tests (Playwright)

Browser coverage includes authentication, legal documents and acceptance, child profiles, vaccines, appointments and interface regressions. Some scenarios mock API responses; others write to a real backend.

## Running

Playwright does not start services. Use a local or dedicated test environment.

1. Start the separate cygnus-api stack, following that repository's instructions.
2. Start this frontend with `docker compose up -d --build web` or `npm run dev`. Both use port 4205; run only one on that port.
3. Install Chromium with `npx playwright install chromium`.
4. Run `npm run test:e2e`.

Set `E2E_BASE_URL` to override the default frontend URL, `http://localhost:4205`. Inspect each spec for any direct API target configuration.

## Fixtures and limitations

- Registration helpers generate unique email addresses. The shared login helper also completes legal acceptance for new accounts.
- Real API scenarios create persistent records; do not assume automatic cleanup.
- Every request comes from one IP. The API's compose stack raises its per-IP rate limits for that reason (it logs `rate_limits.overridden` at boot); against an API running the production limits, a full run draws 429s. The suite runs four workers (`playwright.config.ts`): the API hashes passwords on four threads, and more workers made sign-ups queue past the test timeouts.
- A focused passing scenario does not establish that the complete suite passes.
- Locale is pinned to `pt-BR`; selectors use Portuguese interface copy.
- E2E is not currently part of the main CI workflow. Unit and Storybook checks run separately.

Example focused run: `npm run test:e2e -- e2e/legal-documents.spec.ts`.
