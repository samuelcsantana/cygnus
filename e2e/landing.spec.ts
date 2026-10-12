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
    expect(await page.evaluate('document.documentElement.scrollWidth <= innerWidth')).toBe(true)
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

  await page.getByRole('link', { name: 'Criar conta grátis' }).click()
  await expect(page).toHaveURL(/\/register$/)
})

test("the widget's own link leads to sign-up, because the page is the widget's host", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const widget = page.locator('cygnus-vaccine-schedule')
  // `ready` is the widget saying it painted the schedule (embed/protocol.ts).
  const ready = page.evaluate(
    () => new Promise((resolve) => document.addEventListener('cygnus:ready', resolve, { once: true })),
  )
  await widget.scrollIntoViewIfNeeded()
  await ready

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
