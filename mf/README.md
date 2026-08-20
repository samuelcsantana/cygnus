# Cygnus as a Module Federation remote

The PNI immunization schedule, exposed as a React component another application mounts **inside its
own React tree**, resolved over the network at runtime.

```js
import { init, loadRemote } from '@module-federation/runtime'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

init({
  name: 'your-host',
  remotes: [{ name: 'cygnus', entry: 'https://cygnus.samuelsantana.dev/mf/remoteEntry.js' }],
  shared: {
    react: { version: React.version, lib: () => React, shareConfig: { singleton: true, requiredVersion: '^19.0.0' } },
    'react-dom': { version: ReactDOM.version, lib: () => ReactDOM, shareConfig: { singleton: true, requiredVersion: '^19.0.0' } },
  },
})

const { default: VaccineSchedule } = await loadRemote('cygnus/VaccineSchedule')
```

The host does not bundle any of this. It ships a URL, and the container behind that URL decides what
comes back — which is the property that lets this repository deploy a fix without the host being
rebuilt, and the property that makes the host's uptime depend on this origin.

## What is exposed

| Module | What it is |
|---|---|
| `cygnus/VaccineSchedule` | Default export: the component. Props are `apiOrigin`, `limit`, `onSelect`. |
| `cygnus/runtimeProbe` | `runtimeProbe()` — evidence, not behaviour. See below. |

TypeScript declarations for both are published alongside the entry, at `/mf/@mf-types.zip`, and the
Module Federation tooling on the host side consumes them automatically.

## Federation or the embed?

This repository publishes the same data twice, in two shapes, and the difference is the whole point.

| | [`embed/`](../embed/README.md) | this |
|---|---|---|
| What crosses | a `<script>` that writes DOM, or an iframe | a React component |
| React | none — the widget has no framework | **the host's instance**, negotiated |
| Isolation | shadow root, `all: initial` | none: shared runtime, shared tree |
| Host may pass | HTML attributes | props, callbacks, context, refs |
| Trust required | the iframe variant needs none | total — this runs as host code |
| Host stack | anything that renders HTML | React 19, or nothing loads |

The embed says *"I do not trust you and you should not trust me."* Federation says *"we are one
application, assembled from two repositories."* Neither is the upgrade of the other; a host that
cannot commit to React 19 has no business consuming this and should take the iframe.

## `singleton: true` is the load-bearing word

Both sides declare `react` and `react-dom` as singletons with `requiredVersion: '^19.0.0'`. Drop the
flag and the container is entitled to satisfy the remote from its own bundled copy — and it will,
silently. The widget still renders, which is exactly the problem: two React instances mean two
dispatchers, two context registries, two reconcilers. Nothing fails until the remote touches
something the host owns, and by then the symptom is several layers from the cause.

`requiredVersion` is what lets the negotiation *refuse*. A host on React 18 gets an error at load
time rather than a subtly broken tree.

**`runtimeProbe` exists to make the negotiation observable.** It returns `React.useState` and
`React.createElement` by reference rather than a version string, because both sides report `19.2.x`
whether or not they share an instance — a version match proves nothing, while reference equality can
only hold if exactly one copy exists. Host-side:

```js
const { runtimeProbe } = await loadRemote('cygnus/runtimeProbe')
runtimeProbe().useState === React.useState // true ⇒ one React, negotiated
```

The obvious alternative — the host stamping a marker onto `React` before loading — does not survive
contact with reality: an ES module namespace object is sealed, so the write throws where it is not
silently dropped.

## Limitations, and the ones that will bite

**Styles are injected into the host's `<head>`, not scoped by the platform.** Federated CSS has no
good answer: the container hands the host a JavaScript module, and any stylesheet emitted next to it
is the host's problem to find and load. So the component injects one `<style>` element, once, with
every selector prefixed `cygnus-mf-`. A test asserts that prefix discipline, because the failure it
prevents — restyling somebody else's page — is silent and remote.

The embed solves the same problem properly, with a shadow root. That is not available here **by
construction**: a shadow root would also sever the component from the host's React tree, and being
in that tree is the reason to federate instead of embed.

**Copy is Portuguese, with no way for a host to change it.** Reaching i18next would mean either
shipping a second translation runtime into the host's page or negotiating one the host may not have.
A host wanting another language has no supported path today.

**The host's CSP governs everything.** A policy with `script-src 'self'` blocks `remoteEntry.js`, and
`connect-src 'self'` blocks the component's own fetch to this API. Neither is fixable from this side.

**`remoteEntry.js` has a stable, unhashed filename**, so it cannot carry a long cache — it is served
`max-age=600`. Everything behind it is content-hashed and served `immutable`.

**Availability is now shared.** A host page that mounts this widget depends on this origin being up.
That is the cost of runtime resolution, it is not hypothetical, and a host that has not wrapped the
mount in an error boundary will take a blank page instead of a missing widget. This is the one
limitation the embed's iframe variant does not have.

**Source maps are published.** Reading the container's chunk graph is how a host operator diagnoses a
negotiation that went wrong, and there is nothing private in a widget that renders public policy.

## Build

`npm run build:mf`, and it runs as the last step of `npm run build`.

`vite.mf.config.ts` is separate from the app's config for the same reason the embed's is: adding the
federation plugin to `vite.config.ts` would change how the *application* chunks and resolves its own
dependencies in order to produce an artifact the application never loads.

Two details in that config are there because the first build got them wrong:

- **`rollupOptions.input` names `mf/container.ts` explicitly.** Vite treats a root `index.html` as
  the default entry, so the first run emitted the whole application — every route, 139 chunks, 7 MB
  — next to a remote that needs none of it. Naming the entry brought it to 23 files.
- **`dts.tsConfigPath` points at `tsconfig.mf.json`.** The generator otherwise extends the project
  root's tsconfig, which is solution-style and carries no `jsx`, so type generation failed TS17004
  on every JSX line while the bundle built perfectly.

**Type generation cannot gate this build, and nothing here pretends otherwise.** With a type error
planted in an exposed module, `npm run build:mf` exits 0, prints no diagnostic at all, and writes a
declaration asserting `number` for a value the source initialises with a string — the generator runs
in a detached child process that reports after Vite has finished, and `emitDeclarationOnly` emits
regardless of diagnostics. What actually gates it is `tsc -b`, the first step of `npm run build`,
which covers `mf/` because `tsconfig.app.json` includes it. Keep that ordering: types published from
a build that never typechecked are worse than no types, because the host trusts them.
