import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'

/**
 * The script-tag artifact, built separately from the app on purpose.
 *
 * The embed runs inside pages this project does not control, so it shares nothing with the app
 * bundle: no React, no Tailwind, no router. Those are the right dependencies for an application and
 * the wrong ones for a widget somebody pastes into their site — a host should not pay 130 kB to
 * render a list, and every dependency here is one the host inherits without asking.
 *
 * IIFE with a single input, which is also why the iframe page has its own config: a classic
 * `<script src>` with no `type="module"` is what survives being pasted into a CMS that strips
 * attributes, and the IIFE format takes exactly one entry.
 *
 * `emptyOutDir: false` because this writes into the app's `dist/` after `vite build` filled it.
 * One origin serving both is what makes the script and the iframe reachable at the host the app
 * already has.
 */
export default defineConfig({
  build: {
    outDir: 'dist/embed',
    emptyOutDir: false,
    lib: {
      entry: fileURLToPath(new URL('./embed/embed.ts', import.meta.url)),
      formats: ['iife'],
      name: 'CygnusEmbed',
      // Stable, unhashed: this URL gets copied into someone else's HTML and can never change.
      fileName: () => 'embed.js',
    },
    target: 'es2020',
  },
})
