/**
 * The geometry of the Cygnus mark, in a 64 unit box.
 *
 * `public/favicon.svg` holds the same drawing and is the source of the PNG icons
 * (`scripts/render-brand-icons.mjs`). `BrandMark.test.tsx` fails if the two drift apart.
 */

/**
 * The night sky, top to bottom: navy into the app's own green (`--color-auth-button`).
 *
 * The green used to be #163a2e, which read as black: on the dark page background it measured
 * 1.36:1, so the tile's edge disappeared, and next to the green buttons the mark looked like a
 * different brand. #2d6a4f is 2.65:1 there and is the green of every primary action. The top stays
 * a night navy, lifted slightly to meet it, and the stars keep 10.8:1 against it.
 */
export const BRAND_MARK_SKY = ['#14304d', '#2d6a4f'] as const

/** Back to front: body, tail, the two faces of the wing, the neck, the head, the bill. */
export const BRAND_MARK_FACES = [
  { points: '18.5,50.5 42,42 44.5,52', fill: '#b4c2d1' },
  { points: '11.5,40.5 25.2,38.4 42,42 18.5,50.5', fill: '#e4eaf1' },
  { points: '42,42 57,32.5 44.5,52', fill: '#8fa3b8' },
  { points: '25.2,38.4 38,30.5 42,42', fill: '#ffffff' },
  { points: '38,30.5 57,32.5 42,42', fill: '#eef2f7' },
  { points: '21,39 25.2,38.4 24.6,11 22.2,12', fill: '#c9d4e2' },
  { points: '17,39.5 21,39 22.2,12 19.6,12.8', fill: '#ffffff' },
  { points: '24.8,10.4 16.4,11.4 8,16.6 20.6,15.6', fill: '#f1f5f9' },
  // The orange bill of a mute swan, the one splash of warm colour.
  { points: '12.4,13.9 8,16.6 13.2,16.2', fill: '#f59e0b' },
] as const

/** Four-pointed stars, never dots (see BrandMark for why). */
export const BRAND_MARK_STARS = [
  'M48 8.6C48.88 12.12 48.88 12.12 52.4 13C48.88 13.88 48.88 13.88 48 17.4C47.12 13.88 47.12 13.88 43.6 13C47.12 12.12 47.12 12.12 48 8.6Z',
  'M56.5 18.9C56.92 20.58 56.92 20.58 58.6 21C56.92 21.42 56.92 21.42 56.5 23.1C56.08 21.42 56.08 21.42 54.4 21C56.08 20.58 56.08 20.58 56.5 18.9Z',
  'M38.5 6.9C38.82 8.18 38.82 8.18 40.1 8.5C38.82 8.82 38.82 8.82 38.5 10.1C38.18 8.82 38.18 8.82 36.9 8.5C38.18 8.18 38.18 8.18 38.5 6.9Z',
] as const

export const BRAND_MARK_STAR_FILL = '#fde68a'
