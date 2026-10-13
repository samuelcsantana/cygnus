import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { registerAndLogin, uniqueTestUser } from './support/fixtures.js'

test('the landing page greets a visitor at /, readable and accessible at phone and desktop widths in both themes', async ({
  page,
}) => {
  // Reduced motion, as the other axe passes do: an element mid-entrance is
  // still partly transparent, and axe reads that as low contrast.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const authMe: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/auth/me')) authMe.push(request.url())
  })

  await page.goto('/')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Vacinas, consultas e crescimento dos seus filhos, num lugar só.',
  )

  for (const [width, height, colorScheme] of [
    [360, 800, 'light'],
    [360, 800, 'dark'],
    [1280, 900, 'light'],
    [1280, 900, 'dark'],
  ] as const) {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ colorScheme })
    // Polled, not read once: on the first frame after a resize from desktop the
    // preview's floating alert still sits at its desktop offset and overhangs
    // by 6px, then settles (measured 8 times in 12 right after the resize, 0
    // times 1.5s later). A real overflow persists, and still fails here.
    await expect.poll(() => page.evaluate('document.documentElement.scrollWidth <= innerWidth')).toBe(true)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.screenshot({ path: `docs/verification/landing-${width}-${colorScheme}.png`, fullPage: true })
  }

  // A visitor with no session must not wait on the API to see the page.
  expect(authMe).toEqual([])

  await page.getByRole('button', { name: 'EN (English)' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    "Your children's vaccines, checkups and growth, all in one place.",
  )
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await page.getByRole('button', { name: 'PT (Português)' }).click()
})

test('the demo opens a sample family without sign-up or the terms gate, and leaving returns to the landing page', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  await page.getByRole('button', { name: 'Ver demonstração' }).first().click()

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60_000 })
  const banner = page.getByRole('region', { name: 'Demonstração' })
  await expect(banner).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Antes de continuar' })).toHaveCount(0)
  await expect(page.getByText('Helena').first()).toBeVisible()
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' })
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([])
  await page.screenshot({ path: 'docs/verification/demo-dashboard.png', fullPage: true })

  await banner.getByRole('button', { name: 'Sair' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Vacinas, consultas e crescimento dos seus filhos, num lugar só.',
  )
})

test('the back button from inside the demo returns to the landing page, whose demo button resumes it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const demoStarts: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/auth/demo')) demoStarts.push(request.url())
  })
  await page.goto('/')
  await page.getByRole('main').getByRole('button', { name: 'Ver demonstração' }).click()
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60_000 })
  await expect(page.getByRole('region', { name: 'Demonstração' })).toBeVisible()

  await page.goBack()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Vacinas, consultas e crescimento dos seus filhos, num lugar só.',
  )
  await page.getByRole('main').getByRole('button', { name: 'Ver demonstração' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  // The same demo, not a second account.
  expect(demoStarts).toHaveLength(1)
})

test('the theme and language controls stay put from the landing page to the sign-in screens', async ({ page }) => {
  for (const width of [390, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    const positions: string[] = []
    for (const path of ['/', '/login', '/register']) {
      await page.goto(path)
      const language = await page.getByRole('group', { name: 'Idioma' }).boundingBox()
      const theme = await page.getByRole('button', { name: 'Mudar para o tema escuro' }).boundingBox()
      positions.push(JSON.stringify([language?.x, language?.y, theme?.x, theme?.y]))
    }
    expect(new Set(positions).size, `at ${width}px: ${positions.join(' | ')}`).toBe(1)
  }
})

test('the sign-in screen offers the demo above the form', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/login')

  await page.getByRole('button', { name: /Ver demonstração/ }).click()

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60_000 })
  await expect(page.getByRole('region', { name: 'Demonstração' })).toBeVisible()
})

test("the widget's own link leads to sign-up, because the page is the widget's host", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  // `ready` is the widget saying it painted the schedule (embed/protocol.ts). The listener goes in
  // before the page loads: the widget can paint, and announce it, before goto returns, and a
  // listener added afterwards waited for an event that had already happened (it timed out in one
  // full parallel run of two on 2026-10-13). Strings, like the other specs' evaluate calls: e2e/ is
  // typed without the DOM library.
  await page.addInitScript(
    "window.cygnusReady = new Promise((resolve) => document.addEventListener('cygnus:ready', resolve, { once: true }))",
  )
  await page.goto('/')
  await page.locator('cygnus-vaccine-schedule').scrollIntoViewIfNeeded()
  await page.evaluate('window.cygnusReady')

  // The widget's shadow root is closed by design — a host cannot reach inside,
  // and neither can a locator — so its link is reached the way a keyboard user
  // reaches it: Tab from the code snippet just before it, then Enter.
  await page.getByRole('region', { name: 'O HTML que um site cola para mostrar o widget' }).focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/register$/)
})

test('someone signed in who opens / lands on the dashboard, as before', async ({ page }) => {
  await registerAndLogin(page, uniqueTestUser('landing'))

  await page.goto('/')

  await expect(page).toHaveURL(/\/dashboard$/)
})
