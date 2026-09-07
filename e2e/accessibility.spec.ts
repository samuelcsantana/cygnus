import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { addBaby, openAddBabyDialog, registerAndLogin, uniqueTestUser } from './support/fixtures.js'

/**
 * Routes wrap their content in a fade/slide entrance animation
 * (animate-fade-in-up, index.css). Scanning mid-transition makes axe see
 * genuinely-reduced opacity and report false color-contrast violations —
 * disabling animations makes every scan reflect the settled, final state.
 */
async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' })
}

async function expectNoViolations(page: Page): Promise<void> {
  await disableAnimations(page)
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
}

test.describe('accessibility (WCAG 2 A/AA)', () => {
  test('login page has no violations', async ({ page }) => {
    await page.goto('/login')
    await expectNoViolations(page)
  })

  test('register page has no violations', async ({ page }) => {
    await page.goto('/register')
    await expectNoViolations(page)
  })

  test('the authenticated app has no violations across its main pages', async ({ page }) => {
    const user = uniqueTestUser('a11y')
    await registerAndLogin(page, user)

    // Empty-state dashboard (no children yet).
    await expectNoViolations(page)

    await openAddBabyDialog(page)
    await expectNoViolations(page) // o diálogo de novo perfil

    await addBaby(page, { name: 'Sofia E2E', birthDate: '2025-04-20', sexAtBirth: 'Feminino' })
    await expectNoViolations(page) // populated dashboard

    await page.getByRole('link', { name: 'Vacinas', exact: true }).click()
    await expect(page).toHaveURL(/\/vaccines$/)
    await expectNoViolations(page)

    await page.getByRole('link', { name: 'Consultas', exact: true }).click()
    await expect(page).toHaveURL(/\/appointments$/)
    await expectNoViolations(page)

    // The professionals page joined the menu in #84, so the sweep follows it there.
    await page.getByRole('link', { name: 'Profissionais', exact: true }).click()
    await expect(page).toHaveURL(/\/profissionais$/)
    await expectNoViolations(page)

    // Growth reads the appointments and has an empty state of its own, which is
    // what this account is in — the state most pages are never scanned in.
    await page.getByRole('link', { name: 'Crescimento', exact: true }).click()
    await expect(page).toHaveURL(/\/crescimento$/)
    await expectNoViolations(page)

    await page.getByRole('link', { name: 'Marcos', exact: true }).click()
    await expect(page).toHaveURL(/\/milestones$/)
    await expectNoViolations(page)

    // Not `exact`: notifications is the bell in the top bar, and its accessible
    // name carries the unread count when there is one ("Notificações, 2 não lidas").
    await page.getByRole('link', { name: /^Notificações/ }).click()
    await expect(page).toHaveURL(/\/notifications$/)
    await expectNoViolations(page)
  })

  /**
   * The only pass over the drawer. Every other spec runs at Playwright's
   * desktop width, where the menu is the fixed column and the drawer never
   * mounts — so nothing above this line has ever opened it, and on a phone it
   * is the *whole* navigation.
   */
  test('the menu drawer on a phone has no violations', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const user = uniqueTestUser('a11y-drawer')
    await registerAndLogin(page, user)
    await openAddBabyDialog(page)
    await addBaby(page, { name: 'Bento E2E', birthDate: '2025-01-15', sexAtBirth: 'Masculino' })

    await page.getByRole('button', { name: 'Abrir menu' }).click()
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()
    await expectNoViolations(page)

    // Navigating from inside it must also shut it: a menu that covers the page
    // and stays open after a tap leaves the destination unreachable.
    await drawer.getByRole('link', { name: 'Medicamentos', exact: true }).click()
    await expect(page).toHaveURL(/\/medications$/)
    await expect(drawer).toBeHidden()
    await expectNoViolations(page)
  })
})
