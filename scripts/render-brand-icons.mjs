import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

/**
 * Renders the PNG app icons from `public/favicon.svg`.
 *
 *   node scripts/render-brand-icons.mjs
 *
 * Needs the Chromium build the story suite already uses (`npx playwright install chromium`).
 *
 * **Why the PNGs are generated and not exported by hand.** The SVG is the only drawing; the four
 * PNGs are views of it at different sizes and shapes. Drawn separately, they drift: the tab, the
 * home screen and the screen end up showing three slightly different marks, and nothing fails.
 * Re-run this after any change to the SVG and commit the result.
 *
 * The shapes differ on purpose:
 * - `icon-192.png`, `icon-512.png` ("any"): the rounded tile with transparent corners, as the
 *   browser shows it in install prompts and on desktop.
 * - `apple-touch-icon.png` (180): square and full-bleed. iOS rounds the corners itself and paints
 *   transparent pixels black, so the rounded version would arrive with black corners.
 * - `icon-maskable-512.png`: full-bleed, with the drawing scaled to 78% about the centre. Android
 *   crops maskable icons to shapes as small as a circle of 80% of the width; at 78% the farthest
 *   points of the swan and the stars stay inside it.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(resolve(ROOT, 'public/favicon.svg'), 'utf8')

const square = (svg) => svg.replace(' rx="14.4"', '')
const maskable = (svg) => square(svg).replace('<g id="mark">', '<g id="mark" transform="translate(32 32) scale(0.78) translate(-32 -32)">')

const outputs = [
  { file: 'icon-192.png', size: 192, svg: source },
  { file: 'icon-512.png', size: 512, svg: source },
  { file: 'apple-touch-icon.png', size: 180, svg: square(source) },
  { file: 'icon-maskable-512.png', size: 512, svg: maskable(source) },
]

// The variants are string edits of the SVG; if its structure changes they would silently stop applying.
for (const needle of [' rx="14.4"', '<g id="mark">', 'width="64" height="64"']) {
  if (!source.includes(needle)) throw new Error(`public/favicon.svg no longer contains ${needle}`)
}

const browser = await chromium.launch()
const page = await browser.newPage()
for (const { file, size, svg } of outputs) {
  const sized = svg.replace('width="64" height="64"', `width="${size}" height="${size}"`)
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${sized}`)
  await page.screenshot({ path: resolve(ROOT, 'public', file), omitBackground: true })
  console.log(`public/${file} ${size}x${size}`)
}
await browser.close()
