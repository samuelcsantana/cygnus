import { fileURLToPath, URL } from 'node:url'

import { federation } from '@module-federation/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * The Module Federation remote, built separately from the app for the same reason the embed is.
 *
 * Adding the federation plugin to `vite.config.ts` would rewrite how the *application* chunks and
 * resolves its own dependencies, to serve an artifact the application itself never loads. A separate
 * config keeps that blast radius at zero: break this and `npm run dev` is untouched.
 *
 * `emptyOutDir: false` because this writes into `dist/` after `vite build` has filled it — one
 * origin serving the app, the embed and the remote is what makes `/mf/remoteEntry.js` reachable at a
 * host the project already owns.
 *
 * **The filename is stable and unhashed, deliberately.** A host resolves this URL at runtime, from
 * its own deployment, which this project cannot redeploy — the same constraint the embed has. Hashed
 * chunk names live *behind* the entry, so a new build still busts its own internals while the door
 * keeps its address. `vercel.json` serves it with a short max-age for exactly this reason.
 */
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'cygnus',
      filename: 'remoteEntry.js',
      exposes: {
        './VaccineSchedule': './mf/VaccineSchedule.tsx',
        './runtimeProbe': './mf/runtime-probe.ts',
      },
      shared: {
        // `singleton` is the load-bearing word. Without it a host that already has React gets a
        // second copy — which renders fine and then fails the moment the remote touches the host's
        // context or state, because hooks are per-instance. `requiredVersion` is what lets the
        // container refuse a host too old to share with, instead of silently duplicating.
        react: { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
      },
      dts: {
        // Without an explicit path the generator extends the project root's tsconfig, which is
        // solution-style — `files: []` plus references — and carries no `jsx`. Every JSX line in the
        // exposed component failed TS17004 while the bundle built perfectly.
        tsConfigPath: './tsconfig.mf.json',
        // Best effort, and deliberately not relied on. Measured, not assumed: with a type error
        // planted in an exposed module this build still exited 0, printed no DTS line at all, and
        // wrote a declaration asserting `number` for a value the source initialises with a string.
        // Two independent reasons — the generator runs in a detached child process that reports
        // after Vite has already finished, and `emitDeclarationOnly` emits regardless of
        // diagnostics.
        //
        // What actually gates this is `tsc -b`, the first step of `npm run build`, which covers
        // `mf/` because tsconfig.app.json includes it. Keep that ordering: types published from a
        // build that never typechecked are worse than no types, because the host trusts them.
        generateTypes: { abortOnError: true },
      },
      // This container exposes and never consumes. Saying so drops the remote-resolution half of the
      // federation runtime from the entry a host downloads on every page that mounts the widget.
      disableRemote: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // The app's `public/` is already copied to `dist/` by the main build. Copying it a second time
  // into `dist/mf/` would publish a duplicate favicon under a path nothing references.
  publicDir: false,
  build: {
    outDir: 'dist/mf',
    emptyOutDir: false,
    rollupOptions: {
      // Without this the build has two entries, not one. Vite treats a root `index.html` as the
      // default entry, so the first run of this config emitted the whole application — every route,
      // every dialog, 139 chunks and 7 MB — sitting next to a remote that needs none of it. The
      // federation plugin contributes the container entry itself; the only thing this has to say is
      // that the application is not also one.
      input: fileURLToPath(new URL('./mf/container.ts', import.meta.url)),
    },
    // Module Federation's container protocol is ESM top-level-await; es2020 (what the embed targets)
    // cannot express it.
    target: 'esnext',
    // Reading the remote's own chunk graph is how a host operator debugs a version negotiation that
    // went wrong. There is nothing private in it.
    sourcemap: true,
  },
})
