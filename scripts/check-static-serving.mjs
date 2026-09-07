import assert from 'node:assert/strict'

// Run against the production Docker build, not Vite's development server:
// STATIC_BASE_URL=http://localhost:4205 node scripts/check-static-serving.mjs
const base = process.env.STATIC_BASE_URL ?? 'http://localhost:4205'
const get = (path) => fetch(new URL(path, base), { signal: AbortSignal.timeout(10_000) })

const app = await get('/index.html')
assert.equal(app.status, 200)
assert.equal(app.headers.get('x-frame-options'), 'DENY')
assert.match(app.headers.get('content-security-policy'), /frame-ancestors 'none'/)
assert.equal(app.headers.get('cache-control'), 'no-cache')
const html = await app.text()
const asset = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1]
assert.ok(asset, 'The app must reference a built JavaScript asset')
assert.equal((await get(asset)).headers.get('cache-control'), 'public, max-age=31536000, immutable')

for (const path of ['/embed/iframe.html', '/embed/iframe.js', '/embed/embed.js']) {
  const response = await get(path)
  assert.equal(response.status, 200, path)
  assert.equal(response.headers.get('x-frame-options'), null, path)
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors \*/, path)
  assert.equal(response.headers.get('cache-control'), 'public, max-age=600', path)
}

const remote = await get('/mf/remoteEntry.js')
assert.equal(remote.status, 200)
assert.equal(remote.headers.get('access-control-allow-origin'), '*')
assert.equal(remote.headers.get('cache-control'), 'public, max-age=600')
const remoteCode = await remote.text()
const remoteAsset = remoteCode.match(/(?:\.\/)?assets\/[^"'\s]+\.js/)?.[0]
assert.ok(remoteAsset, 'The remote must reference a built JavaScript asset')
const federatedAsset = await get(`/mf/${remoteAsset.replace(/^\.\//, '')}`)
assert.equal(federatedAsset.status, 200)
assert.equal(federatedAsset.headers.get('access-control-allow-origin'), '*')
assert.equal(federatedAsset.headers.get('cache-control'), 'public, max-age=31536000, immutable')

assert.equal((await get('/sw.js')).headers.get('cache-control'), 'no-cache')
for (const path of ['/assets/missing.js', '/embed/missing.js', '/mf/missing.js']) {
  assert.equal((await get(path)).status, 404, path)
}
assert.equal((await get('/dashboard')).status, 200, 'SPA routes must still load')
console.log('PASS: app isolation, iframe embedding, MF CORS, cache policies and missing assets')

if (process.argv.includes('--browser')) {
  const { createServer } = await import('node:http')
  const { chromium } = await import('@playwright/test')
  const browser = await chromium.launch({ headless: true })
  const host = createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html' })
    response.end('<!doctype html><title>Embed consumer</title><body></body>')
  })
  try {
    await new Promise((resolve, reject) => {
      host.once('error', reject)
      host.listen(0, '127.0.0.1', resolve)
    })
    const page = await browser.newPage()
    await page.goto(`http://127.0.0.1:${host.address().port}`)
    await page.evaluate((src) => {
      window.embedMessages = []
      const iframe = document.createElement('iframe')
      window.addEventListener('message', (event) => {
        if (event.source === iframe.contentWindow && event.origin === new URL(src).origin) {
          window.embedMessages.push(event.data)
        }
      })
      iframe.src = src
      document.body.append(iframe)
    }, new URL('/embed/iframe.html?limit=2', base).href)
    await page.waitForFunction(() => window.embedMessages.some((message) => message.type === 'ready'), undefined, { timeout: 15_000 })
    const messages = await page.evaluate(() => window.embedMessages)
    assert.equal(messages.some((message) => message.type === 'error'), false, JSON.stringify(messages))
    const ready = messages.find((message) => message.type === 'ready')
    assert.equal(ready.source, 'cygnus-embed')
    assert.equal(ready.version, 1)
    assert.ok(ready.height > 0)
    console.log('PASS: cross-origin iframe loads the real API and emits protocol v1 ready')
  } finally {
    await browser.close()
    await new Promise((resolve) => host.close(resolve))
  }
}
