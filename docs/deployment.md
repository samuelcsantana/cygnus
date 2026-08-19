# Deployment

## Two targets, on purpose

| Target | What it serves | Config |
|---|---|---|
| **Vercel** | the application | `vercel.json` |
| **Docker + nginx** | the same build, self-hosted | `Dockerfile`, `nginx.conf`, `security-headers.conf.template` |

The nginx setup predates Vercel and is kept: it is how the app runs under `docker compose` locally, and it keeps
self-hosting an option rather than a rewrite. The consequence is that **the security headers exist in two places
and can drift**. If you change one, change the other — the list below is the contract.

## Security headers

Ported from `security-headers.conf.template` into `vercel.json`:

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | see below |

Two deliberate differences from the nginx version:

**1. The CSP allows the Sentry ingest host.** The nginx CSP is `connect-src 'self' ${API_ORIGIN}` — nothing else.
Ported literally, it would have **silently blocked every Sentry event**, because the browser refuses the POST to
`o325983.ingest.us.sentry.io` before it leaves the page. Error reporting would have looked wired up and reported
nothing, which is worse than having no Sentry at all.

The nginx template still lacks it. It is not wrong there *yet* only because that path has never run in an
environment with a real DSN. Fix it there before self-hosting.

**2. No `Strict-Transport-Security`.** Not an omission: Vercel already sends
`max-age=63072000; includeSubDomains; preload` on its own. The nginx template deliberately omits HSTS too, for the
opposite reason — it listens on `:80` with no TLS in front, so promising a secure transport would be a lie.

## Caching

`/assets/*` is immutable for a year (Vite hashes those filenames, so a changed file is a changed URL);
`index.html` is `no-cache` so a deploy is picked up on the next navigation. Same split as `nginx.conf`.

## Environment

Both variables are read at **build** time by Vite and baked into the bundle — setting them at runtime does
nothing.

| Variable | Source | State |
|---|---|---|
| `VITE_SENTRY_DSN` | `.env.production`, committed | set — a DSN is not a credential, see the comment in that file |
| `VITE_API_BASE_URL` | `.env.production`, committed | **empty** |

`VITE_API_BASE_URL` being empty is the open item: **`cygnus-api` is not deployed anywhere.** The frontend builds
and serves fine without it, but nothing that needs the backend — login included — can work. Until the API has a
home, this deployment is a public shell.

When the API does land, two things have to change together, or the app breaks in a way that is annoying to debug:

1. `VITE_API_BASE_URL` in `.env.production`
2. the `connect-src` in **both** `vercel.json` and `security-headers.conf.template`

The nginx template derives its `${API_ORIGIN}` from the same build arg automatically. `vercel.json` cannot — it is
static JSON, so the origin is written out literally and has to be kept in step by hand.

## SPA routing

`createBrowserRouter` means any deep link has to fall back to the app shell. `vercel.json`'s rewrite does that;
Vercel serves a real file when one matches, so the catch-all only applies to routes. `nginx.conf` does the same
with `try_files $uri $uri/ /index.html`.
