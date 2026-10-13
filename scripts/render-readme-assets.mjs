import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

/**
 * Renders the images the two READMEs show: screenshots of the live demo, and the covers.
 *
 *   node scripts/render-readme-assets.mjs            # screenshots, then covers
 *   node scripts/render-readme-assets.mjs --covers   # covers only, from the screenshots on disk
 *
 * Needs the Chromium build the story suite already uses (`npx playwright install chromium`).
 *
 * **Why a script and not a design file.** Same reason as `render-brand-icons.mjs`: the screenshots
 * are views of the app and the covers are views of the screenshots, the mark and the fonts the app
 * ships. Made by hand, they drift from the product the moment the UI changes, and nothing fails.
 * Re-run after a visible change and commit the result.
 *
 * - Screenshots come from `BASE_URL` (production by default), through the real "Try the demo"
 *   button: a disposable account, so the README shows the data a visitor sees. One run opens **one**
 *   demo; the API allows 10 per IP per hour. Both themes are taken from that one session.
 * - The covers are HTML rendered here: `cover.webp` (README, 2x) and `social-preview.jpg`
 *   (1280x640, under GitHub's 1 MB limit; uploaded by hand in Settings → Social preview, which has
 *   no API).
 * - The API repository's cover is rendered here too, because this repository already has the
 *   browser, the fonts and the mark. It is written to `API_ASSETS_DIR`, or to a sibling
 *   `../cygnus-api` checkout when one exists, and committed there. Without either it is skipped,
 *   so a clone of this repository alone never gets a folder created beside it.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BASE_URL = process.env.BASE_URL ?? 'https://cygnus.samuelsantana.dev'
const OUT = resolve(ROOT, '.github/assets')
const SCREENS = resolve(OUT, 'screens')
const API_REPO = resolve(ROOT, '../cygnus-api')
const API_OUT = process.env.API_ASSETS_DIR
  ? resolve(ROOT, process.env.API_ASSETS_DIR)
  : existsSync(resolve(API_REPO, 'package.json'))
    ? resolve(API_REPO, '.github/assets')
    : null
const coversOnly = process.argv.includes('--covers')

mkdirSync(SCREENS, { recursive: true })
if (API_OUT) mkdirSync(API_OUT, { recursive: true })

const browser = await chromium.launch()

// Chromium encodes WebP through a canvas, so no image library is needed. A screenshot of a UI is
// mostly flat colour and text: WebP at 0.9 keeps the text sharp at about a fifth of the PNG
// (the dashboard: 89 kB against 403 kB at the same 1800x1125).
const encoder = await browser.newPage()
async function writeWebp(path, png, quality = 0.9) {
  const dataUrl = await encoder.evaluate(
    async ({ src, quality }) => {
      const image = new Image()
      image.src = src
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      canvas.getContext('2d').drawImage(image, 0, 0)
      return canvas.toDataURL('image/webp', quality)
    },
    { src: `data:image/png;base64,${png.toString('base64')}`, quality },
  )
  writeFileSync(path, Buffer.from(dataUrl.split(',')[1], 'base64'))
  log(path)
}

// Printed from the folder above, so the API's cover is told apart from this repository's.
function log(path) {
  console.log(relative(resolve(ROOT, '..'), path).replaceAll('\\', '/'))
}

// networkidle is not enough: a query can start after the network goes quiet, and the dashboard
// was caught three ways that it missed: as grey skeletons, as the session gate's spinner, and as
// overview cards still printing their loading text. The cards print `common.loading` as plain
// text, with no class or role to wait on, so the app's own word for it is read from the locale
// shot here.
const LOADING_TEXT = ['en'].map(
  (lng) => JSON.parse(readFileSync(resolve(ROOT, `src/locales/${lng}.json`), 'utf8')).common.loading,
)
function isSettled(loadingText) {
  if (document.querySelector('.animate-pulse, .animate-spin')) return false
  return ![...document.querySelectorAll('p, span')].some((el) => loadingText.includes(el.textContent.trim()))
}

// Production allows 100 API requests a minute per IP, and one run here can make more than that. A
// page that loaded through a 429 shows an error card instead of the app, and nothing else notices:
// the dashboard was captured once with two cards reading "could not load". So each page records
// the 429s it receives, and `load` waits out the window and loads the page again.
function watchRateLimit(page) {
  const limit = { hit: false, retryAt: 0 }
  page.on('response', (response) => {
    if (response.status() !== 429) return
    limit.hit = true
    const seconds = Number(response.headers()['retry-after']) || 60
    limit.retryAt = Math.max(limit.retryAt, Date.now() + seconds * 1000)
  })
  return limit
}

// Opens `url`, or reloads when there is none, and returns once the app has finished loading.
async function load(page, limit, url) {
  for (;;) {
    limit.hit = false
    if (url) await page.goto(url)
    else await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForFunction(isSettled, LOADING_TEXT, { timeout: 30_000 })
    await page.waitForTimeout(400)
    if (!limit.hit) return
    const wait = Math.max(0, limit.retryAt - Date.now()) + 1_000
    console.log(`rate limited, loading ${url ?? page.url()} again in ${Math.ceil(wait / 1000)} s`)
    await page.waitForTimeout(wait)
  }
}

async function captureScreens() {
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.25,
    locale: 'en-US',
    // Entrances and count-ups would otherwise be caught half-way.
    reducedMotion: 'reduce',
  })
  await desktop.addInitScript(() => localStorage.setItem('i18nextLng', 'en'))
  const page = await desktop.newPage()
  const pageLimit = watchRateLimit(page)

  const setTheme = (theme) => page.evaluate((t) => localStorage.setItem('theme', t), theme)
  const shoot = async (name, url) => {
    await load(page, pageLimit, url)
    await writeWebp(resolve(SCREENS, `${name}.webp`), await page.screenshot())
  }

  await page.goto(`${BASE_URL}/?lng=en`)
  for (const theme of ['light', 'dark']) {
    await setTheme(theme)
    await shoot(`landing-${theme}`)
  }

  await setTheme('light')
  await page.reload()
  await page.getByRole('button', { name: 'Try the demo' }).first().click()
  // A cold Render instance takes about a minute to wake.
  await page.waitForURL('**/dashboard', { timeout: 120_000 })

  const pages = { dashboard: '/dashboard', vaccines: '/vaccines', growth: '/crescimento' }
  for (const theme of ['light', 'dark']) {
    await setTheme(theme)
    for (const [name, path] of Object.entries(pages)) {
      await shoot(`${name}-${theme}`, `${BASE_URL}${path}`)
    }
  }

  // The phone views reuse the demo's cookies: a second demo would spend another of the ten.
  const phone = await browser.newContext({
    storageState: await desktop.storageState(),
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: 'en-US',
    reducedMotion: 'reduce',
  })
  const phonePage = await phone.newPage()
  const phoneLimit = watchRateLimit(phonePage)
  const shootPhone = async (name, url) => {
    await load(phonePage, phoneLimit, url)
    await writeWebp(resolve(SCREENS, `${name}.webp`), await phonePage.screenshot())
  }
  for (const theme of ['light', 'dark']) {
    await phonePage.addInitScript((t) => localStorage.setItem('theme', t), theme)
    for (const name of ['dashboard', 'vaccines']) {
      await shootPhone(`${name}-phone-${theme}`, `${BASE_URL}${pages[name]}`)
    }
  }
  await phone.close()
  await desktop.close()
}

async function renderCovers() {
  const fonts = resolve(ROOT, 'node_modules/@fontsource-variable')
  const font = (file) => `data:font/woff2;base64,${readFileSync(resolve(fonts, file)).toString('base64')}`
  const screen = (name) => `data:image/webp;base64,${readFileSync(resolve(SCREENS, `${name}.webp`)).toString('base64')}`
  const mark = readFileSync(resolve(ROOT, 'public/favicon.svg'), 'utf8').replace('width="64" height="64"', 'width="100%" height="100%"')

  const head = `<meta charset="utf-8"><style>
    @font-face { font-family: Fraunces; font-weight: 100 900; font-style: normal; src: url(${font('fraunces/files/fraunces-latin-wght-normal.woff2')}) format('woff2'); }
    @font-face { font-family: Fraunces; font-weight: 100 900; font-style: italic; src: url(${font('fraunces/files/fraunces-latin-wght-italic.woff2')}) format('woff2'); }
    @font-face { font-family: Inter; font-weight: 100 900; src: url(${font('inter/files/inter-latin-wght-normal.woff2')}) format('woff2'); }
    ${COVER_CSS}
  </style>`

  const covers = [{ body: webCover({ mark, screen }), dir: OUT }]
  if (API_OUT) covers.push({ body: apiCover({ mark }), dir: API_OUT })
  else console.log('cygnus-api cover skipped: no ../cygnus-api checkout and no API_ASSETS_DIR')

  for (const { body, dir } of covers) {
    // The README banner is wider than the social card: 1280x560 reads as a header, while a
    // 2:1 banner pushes the first line of text below the fold on a laptop.
    for (const { height, scale, file } of [
      { height: 560, scale: 2, file: 'cover.webp' },
      { height: 640, scale: 1, file: 'social-preview.jpg' },
    ]) {
      const page = await browser.newPage({ viewport: { width: 1280, height }, deviceScaleFactor: scale })
      await page.setContent(`<!doctype html><html><head>${head}</head><body>${body(height)}</body></html>`)
      await page.evaluate(() => document.fonts.ready)
      const path = resolve(dir, file)
      if (file.endsWith('.jpg')) {
        await page.screenshot({ path, type: 'jpeg', quality: 90 })
        log(path)
      } else {
        await writeWebp(path, await page.screenshot(), 0.92)
      }
      await page.close()
    }
  }
}

// The brand's four-pointed star (`BRAND_MARK_STARS`), centred on the origin with radius 1.
// Never a dot: drawn as dots, the constellation read as an "X".
const STAR = 'M0 -1C0.2 -0.2 0.2 -0.2 1 0C0.2 0.2 0.2 0.2 0 1C-0.2 0.2 -0.2 0.2 -1 0C-0.2 -0.2 -0.2 -0.2 0 -1Z'
// Fixed positions, so a re-render changes only what actually changed.
const SKY = [
  [452, 46, 9, 0.9], [536, 118, 5, 0.6], [612, 38, 6, 0.7], [700, 92, 4, 0.5], [388, 128, 4, 0.5],
  [1180, 36, 7, 0.7], [1244, 104, 4, 0.5], [962, 30, 5, 0.55], [292, 30, 4, 0.45], [64, 520, 5, 0.4],
  [560, 520, 6, 0.55], [500, 600, 4, 0.4], [210, 600, 4, 0.35], [1100, 70, 4, 0.45],
]
const stars = () =>
  SKY.map(
    ([x, y, r, o]) =>
      `<svg class="star" style="left:${x - r}px;top:${y - r}px;width:${2 * r}px;height:${2 * r}px;opacity:${o}" viewBox="-1 -1 2 2"><path d="${STAR}"/></svg>`,
  ).join('')

const brand = (mark, suffix = '') =>
  `<div class="brand"><div class="tile">${mark}</div><span>Cygnus${suffix ? `<b>${suffix}</b>` : ''}</span></div>`

function webCover({ mark, screen }) {
  return (height) => `<main class="cover" style="height:${height}px">
    ${stars()}
    <section class="copy">
      ${brand(mark)}
      <p class="eyebrow">Children's health, organized</p>
      <h1>Vaccines, checkups<br>and growth, <em>all in one place.</em></h1>
      <p class="lede">Brazil's vaccine schedule, doctor visits, WHO growth charts, milestones and medications, shared by the whole family.</p>
      <ul class="chips"><li>React 19</li><li>TypeScript</li><li>TanStack Query</li><li>Storybook + axe</li></ul>
      <p class="foot"><strong>Live demo, no sign-up</strong> · cygnus.samuelsantana.dev</p>
    </section>
    <figure class="browser" style="top:${height === 640 ? 92 : 64}px">
      <div class="bar"><span>cygnus.samuelsantana.dev/dashboard</span></div>
      <img src="${screen('dashboard-light')}" alt="">
    </figure>
    <figure class="phone" style="top:${height === 640 ? 196 : 150}px">
      <img src="${screen('vaccines-phone-dark')}" alt="">
    </figure>
  </main>`
}

function apiCover({ mark }) {
  return (height) => `<main class="cover" style="height:${height}px">
    ${stars()}
    <section class="copy">
      ${brand(mark, 'API')}
      <p class="eyebrow">The backend of Cygnus</p>
      <h1>Sessions, schedules<br>and reminders, <em>behind one contract.</em></h1>
      <p class="lede">Fastify 5, Prisma 7, PostgreSQL, Redis and BullMQ in a pragmatic Clean Architecture, with an OpenAPI contract the frontend checks on every PR.</p>
      <ul class="chips"><li>58 endpoints</li><li>OpenAPI 3.0</li><li>17 Prisma models</li><li>HttpOnly + CSRF</li></ul>
      <p class="foot"><strong>MIT</strong> · github.com/samuelcsantana/cygnus-api</p>
    </section>
    <figure class="terminal" style="top:${height === 640 ? 96 : 52}px">
      <div class="bar"><span>production · cygnus.samuelsantana.dev/api</span></div>
      <pre><span class="prompt">$</span> curl -i -X POST <span class="url">…/api/auth/demo</span>
<span class="ok">HTTP/1.1 201 Created</span>
<span class="h">set-cookie:</span> access_token=…; Max-Age=900; HttpOnly; Secure; SameSite=Strict
<span class="h">set-cookie:</span> refresh_token=…; HttpOnly; Secure; SameSite=Strict
<span class="h">set-cookie:</span> csrf_token=…; Secure; SameSite=Strict
<span class="h">x-ratelimit-limit:</span> 10

{ <span class="k">"status"</span>: <span class="v">"ok"</span>, <span class="k">"message"</span>: <span class="v">"Demo session started"</span>,
  <span class="k">"expiresAt"</span>: <span class="v">"…"</span> }</pre>
    </figure>
    <figure class="layers" style="top:${height === 640 ? 380 : 296}px">
      <ol>
        <li><b>presentation</b><span>routes · Zod schemas · auth guard</span></li>
        <li><b>infrastructure</b><span>Prisma · Redis · BullMQ · Resend</span></li>
        <li><b>application</b><span>use cases · ports</span></li>
        <li><b>domain</b><span>entities · value objects</span></li>
      </ol>
      <p>dependencies point inward</p>
    </figure>
  </main>`
}

const COVER_CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  .cover {
    position: relative; width: 1280px; overflow: hidden; color: #fff; font-family: Inter, sans-serif;
    background:
      radial-gradient(760px 420px at 88% 112%, rgba(45, 106, 79, 0.95), transparent 70%),
      radial-gradient(640px 380px at 0% -8%, rgba(33, 72, 112, 0.9), transparent 65%),
      linear-gradient(155deg, #0c1d30 0%, #14304d 46%, #1c4a44 78%, #2d6a4f 100%);
  }
  .star { position: absolute; fill: #fde68a; }
  .copy { position: absolute; left: 72px; top: 0; bottom: 0; width: 520px; display: flex; flex-direction: column; justify-content: center; }
  .brand { display: flex; align-items: center; gap: 14px; margin-bottom: 26px; }
  .tile { width: 52px; height: 52px; border-radius: 12px; overflow: hidden; box-shadow: 0 0 0 1px rgba(255,255,255,0.14), 0 10px 24px rgba(0,0,0,0.35); }
  .tile svg { display: block; }
  .brand span { font-family: Fraunces, serif; font-weight: 600; font-size: 34px; letter-spacing: -0.01em; }
  .brand b { font-family: Inter, sans-serif; font-weight: 600; font-size: 15px; letter-spacing: 0.08em; margin-left: 10px; padding: 4px 8px; border-radius: 6px; background: rgba(255,255,255,0.12); vertical-align: 6px; }
  .eyebrow { margin: 0 0 12px; font-size: 13px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #9fd8b9; }
  h1 { margin: 0; font-family: Fraunces, serif; font-weight: 560; font-size: 46px; line-height: 1.08; letter-spacing: -0.015em; }
  h1 em { display: block; font-style: italic; font-weight: 520; color: #a7ecc4; }
  .lede { text-wrap: pretty; margin: 18px 0 0; font-size: 17px; line-height: 1.55; color: #c9d7e3; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 22px 0 0; padding: 0; list-style: none; }
  .chips li { font-size: 13px; font-weight: 600; padding: 6px 11px; border-radius: 999px; background: rgba(255,255,255,0.09); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.16); color: #e7eef5; }
  .foot { margin: 22px 0 0; font-size: 14px; color: #b7c8d6; }
  .foot strong { color: #fde68a; font-weight: 600; }

  figure { margin: 0; position: absolute; }
  .browser {
    left: 660px; width: 780px; border-radius: 14px; overflow: hidden; background: #f5f3ef;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.18), 0 40px 90px rgba(3, 12, 22, 0.6);
    transform: perspective(2200px) rotateY(-11deg) rotateX(3deg); transform-origin: left center;
  }
  .bar { height: 34px; display: flex; align-items: center; padding: 0 14px; background: #e8ebee; border-bottom: 1px solid #d6dbe0; }
  .bar span { font-size: 12px; color: #475569; padding: 4px 12px; border-radius: 999px; background: #fff; }
  .browser img { display: block; width: 100%; }
  .phone {
    left: 600px; width: 214px; padding: 9px; border-radius: 38px; background: #0b0f14;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.22), 0 36px 70px rgba(3, 12, 22, 0.7);
    transform: rotate(-3deg);
  }
  .phone img { display: block; width: 100%; border-radius: 30px; }

  .terminal {
    left: 640px; width: 700px; border-radius: 14px; overflow: hidden; background: #0a1522;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.14), 0 40px 90px rgba(3, 12, 22, 0.6);
  }
  .terminal .bar { background: #0f1e2f; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .terminal .bar span { background: rgba(255,255,255,0.07); color: #9fb3c8; }
  .terminal pre { margin: 0; padding: 18px 20px 20px; font: 500 13px/1.7 'Cascadia Code', Consolas, monospace; color: #dbe5ee; white-space: pre; }
  .prompt { color: #a7ecc4; } .url { color: #9fd8b9; } .ok { color: #6ee7a8; font-weight: 700; }
  .h { color: #8aa0b6; } .k { color: #fde68a; } .v { color: #a7ecc4; }
  .layers {
    left: 936px; width: 314px; padding: 16px 18px 12px; border-radius: 14px; background: #f7f5f0; color: #1f2937;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.3), 0 30px 70px rgba(3, 12, 22, 0.55);
  }
  .layers ol { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
  .layers li { display: grid; gap: 1px; padding: 6px 12px; border-radius: 9px; background: #fff; box-shadow: inset 0 0 0 1px #e5e7eb; }
  .layers li:last-child { background: #e7f4ec; box-shadow: inset 0 0 0 1px #b9dcc6; }
  .layers b { font-size: 13px; color: #2d6a4f; }
  .layers span { font-size: 12px; color: #475569; }
  .layers p { margin: 8px 2px 0; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b; }
`

// Last, so the constants above exist before the top-level await reaches them.
if (!coversOnly) await captureScreens()
await renderCovers()
await browser.close()
