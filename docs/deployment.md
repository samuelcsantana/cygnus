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

Two parts of the CSP look permissive and are not — both files now carry them:

**`connect-src` names the Sentry ingest host.** The SDK POSTs events to `o325983.ingest.us.sentry.io`, and a CSP
without it makes the browser refuse that POST before it leaves the page: error reporting looks wired up and reports
nothing, which is worse than having no Sentry at all. This was originally a Vercel-only fix; the nginx template
carries it now too, so the two agree again.

**`img-src` allows `blob:` and any `https:` host.** Not laxness. The milestone photo field previews a chosen file
through `URL.createObjectURL` — a `blob:` URL — before it uploads, and both `Milestone.photoUrl` and
`Baby.avatarUrl` accept a pasted image URL on any host, by design (locally picked avatars are inlined as `data:`
URLs, which is why that source stays). `img-src 'self' data:` would have turned every uploaded photo and every
pasted URL into a broken image in production, while working perfectly under `vite dev`, which serves no CSP at all.
Tightening it to the API origin means removing the paste-a-URL feature first — a product decision, not a header one.

One deliberate difference from the nginx version remains:

**No `Strict-Transport-Security` in `vercel.json`.** Not an omission: Vercel already sends
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
| `VITE_API_BASE_URL` | `.env.production`, committed | `https://api.cygnus.samuelsantana.dev` |

That host is not a free choice. The auth cookies are issued `SameSite=Strict`, so the browser only returns them to
a **same-site** destination — the same registrable domain. A frontend on `*.vercel.app` calling an API on
`*.onrender.com` would see login return 200, set a cookie, and then 401 on every request after it, which reads as a
broken session rather than a domain mistake. Both hosts sitting under `samuelsantana.dev` is what makes the session
work at all.

Two files carry the origin and both have to move together, or the build succeeds and the app fails at runtime:

1. `VITE_API_BASE_URL` in `.env.production`
2. the `connect-src` in `vercel.json`

The nginx template derives its `${API_ORIGIN}` from the same build arg automatically. `vercel.json` cannot — it is
static JSON, so the origin is written out literally and has to be kept in step by hand.

## SPA routing

`createBrowserRouter` means any deep link has to fall back to the app shell. `vercel.json`'s rewrite does that;
Vercel serves a real file when one matches, so the catch-all only applies to routes. `nginx.conf` does the same
with `try_files $uri $uri/ /index.html`.
