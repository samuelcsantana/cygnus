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
| `VITE_API_BASE_URL` | `.env.production`, committed | `/api` — a path, not an origin. See below |

## The API is proxied, not called directly

`vercel.json` rewrites `/api/*` to `https://cygnus-api.onrender.com/*`. The browser therefore only ever talks to
this app's own origin, and the API is never a cross-origin destination from the page's point of view.

That is not a convenience. The auth cookies are issued `SameSite=Strict`, so a browser sends them only to a
same-site destination — the same registrable domain. The original plan put the API on
`api.cygnus.samuelsantana.dev` to satisfy that, but **Render only offers custom domains on paid instances**, so the
API cannot leave `*.onrender.com`. A frontend on `samuelsantana.dev` calling `*.onrender.com` directly is a
cross-site pair: login returns 200, the browser stores the cookie and then declines to send it back, and every
request after it 401s — a failure that reads as a broken session rather than a domain problem.

Relaxing the cookies to `SameSite=None` is the obvious alternative and it is a dead end. Safari's ITP blocks
third-party cookies outright and Chrome is moving the same way, so cross-site auth cookies are not weaker, they are
unreliable — broken in a real browser today, not in principle.

Proxying removes the question instead of answering it: same-origin is stricter than same-site, so `Strict` cookies
work by construction, and CORS never enters the picture. Two consequences worth knowing:

- The rewrite order in `vercel.json` matters. `/api/:path*` must come **before** the SPA catch-all, which matches
  everything; Vercel takes the first match.
- Vercel's proxy caps a request body at about 4.5 MB, while the upload route accepts 5 MB. A file in that gap fails
  at the edge with a 413 the API never sees.

The Docker/nginx target is unaffected and still calls an absolute origin: the `Dockerfile` passes
`VITE_API_BASE_URL` as a build arg, and Vite gives a real environment variable precedence over `.env` files, so
`/api` here never reaches that build.

## SPA routing

`createBrowserRouter` means any deep link has to fall back to the app shell. `vercel.json`'s rewrite does that;
Vercel serves a real file when one matches, so the catch-all only applies to routes. `nginx.conf` does the same
with `try_files $uri $uri/ /index.html`.
