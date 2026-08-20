# Cygnus embed

An embeddable widget showing the Brazilian PNI immunization schedule, built to be pasted into a site
this project does not control. Two distribution variants, one widget.

```html
<!-- script tag: integrates with the host's layout -->
<div id="vacinas"></div>
<script src="https://cygnus.samuelsantana.dev/embed/embed.js" data-target="#vacinas" defer></script>

<!-- or the element directly -->
<cygnus-vaccine-schedule limit="6"></cygnus-vaccine-schedule>

<!-- iframe: isolates the host from this code entirely -->
<iframe src="https://cygnus.samuelsantana.dev/embed/iframe.html?limit=6"
        style="width:100%;border:0" title="Calendário vacinal"></iframe>
```

## script tag or iframe

Style isolation is **identical** in both — both render into a shadow root with `all: initial`, so
the host's CSS cannot reach in and the widget's cannot leak out. The choice is about something else:

| | script tag | iframe |
|---|---|---|
| JavaScript isolation | none — runs on the host's origin, with access to its DOM | full — separate origin and JS context |
| Trust required from the host | the host is trusting this code | none |
| Layout | reflows with the host for free | host must size the frame; the frame reports its height by `postMessage` |
| Cost | one ~2.5 kB gzip request | a second document |

**Pick the iframe if you do not control the widget's source.** Pick the script tag if you do, and
want it to lay out like the rest of the page.

## The message contract

Versioned from the first commit, in `protocol.ts`. An embed is the one artifact whose consumers
cannot be redeployed: the tag lives in someone else's HTML, and a host that integrated version 1
keeps version 1's expectations forever. Adding a field is safe; changing what one means needs a new
`PROTOCOL_VERSION`, with both handled for as long as old hosts exist.

Messages: `ready`, `resize`, `navigate`, `error`. All carry `source: "cygnus-embed"` and `version`,
because a host page's `message` handler also receives analytics, chat widgets and framework
devtools — `source` is how it tells ours apart.

The transport differs by variant and the contract does not: the iframe posts to `window.parent`, the
custom element dispatches `cygnus:<type>` DOM events, which is the idiom an in-page host already has
handlers for.

```js
window.addEventListener('message', (event) => {
  if (event.data?.source !== 'cygnus-embed' || event.data.version !== 1) return;
  if (event.data.type === 'resize') frame.style.height = `${event.data.height}px`;
});
```

**The embed never navigates the host.** Activating the link emits `navigate` and does nothing else —
a widget that can move the page it sits in is a widget nobody pastes into their site.

## Limitations, and the ones that will bite

**The host's CSP governs everything.** A host sending `script-src 'self'` will block `embed.js`, and
one sending `frame-src 'self'` will block the iframe. Neither is a bug in the widget and neither can
be fixed from this side — the host has to allow `cygnus.samuelsantana.dev`. The iframe usually has
the easier path, because `frame-src` tends to be looser than `script-src` in real policies.

**The API surface it reads is deliberately narrow.** `GET /public/vaccine-schedule` is the only
unauthenticated, any-origin endpoint in the API, and it answers `Access-Control-Allow-Origin: *`
*without* `Access-Control-Allow-Credentials`. That pairing is the safety property: a browser refuses
to send cookies to a wildcard origin, so this widget can never make an authenticated call on a
visitor's behalf, no matter which site it is pasted into.

**`embed.js` has a stable, unhashed filename** — it has to, because the URL is copied into HTML this
project cannot redeploy. That rules out the usual year-long immutable cache; it is served with
`max-age=600` so a fix actually reaches hosts.

**`X-Frame-Options` is absent on `/embed/*` by construction, not by oversight.** It has no
per-origin value — only `DENY` or `SAMEORIGIN` — so an embeddable page cannot override it, it can
only be excluded from it. `frame-ancestors *` in the CSP is what expresses "anyone", and it is safe
here because the widget shows public policy data and holds no session: there is nothing for a
hostile framer to obtain.

**No theming yet.** It follows `prefers-color-scheme` and nothing else. A host wanting brand colors
has no supported way to ask, and adding one means CSS custom properties pierced through the shadow
boundary — deliberate, on a version bump, not by loosening isolation.

## Build

`npm run build:embed` — two Vite configs, because they produce different kinds of artifact:

- `vite.embed.config.ts` — IIFE library, single entry, no `type="module"` needed by the host. IIFE
  takes exactly one entry, which is why the iframe cannot share this config.
- `vite.embed-iframe.config.ts` — an HTML document, which is ours end to end and can be a module.

Neither pulls in React, Tailwind or the router. Those are right for an application and wrong for a
widget: a host should not pay 130 kB to render a list, and every dependency here is one the host
inherits without being asked.
