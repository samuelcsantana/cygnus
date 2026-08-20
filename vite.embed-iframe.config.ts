import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'

/**
 * The iframe artifact. Separate from vite.embed.config.ts because that one is an IIFE library build
 * and this one is an HTML document — Rollup will not take both in a single IIFE build.
 *
 * This document is ours end to end, so it can be a module: no CMS ever touches this tag.
 */
export default defineConfig({
  root: fileURLToPath(new URL('./embed', import.meta.url)),
  base: '/embed/',
  build: {
    outDir: fileURLToPath(new URL('./dist/embed', import.meta.url)),
    emptyOutDir: false,
    rollupOptions: {
      input: fileURLToPath(new URL('./embed/iframe.html', import.meta.url)),
      output: {
        entryFileNames: 'iframe.js',
        assetFileNames: 'iframe[extname]',
      },
    },
    target: 'es2020',
  },
})
