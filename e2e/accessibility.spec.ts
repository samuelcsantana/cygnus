import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { addBaby, registerAndLogin, uniqueTestUser } from './support/fixtures.js'

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

    await page.getByRole('link', { name: 'Começar Agora: Adicionar Criança' }).click()
    await expectNoViolations(page) // /add-baby form

    await addBaby(page, { name: 'Sofia E2E', birthDate: '2025-04-20', gender: 'Menina' })
    await expectNoViolations(page) // populated dashboard

    await page.getByRole('link', { name: 'Vacinas', exact: true }).click()
    await expect(page).toHaveURL(/\/vaccines$/)
    await expectNoViolations(page)

    await page.getByRole('link', { name: 'Consultas', exact: true }).click()
    await expect(page).toHaveURL(/\/appointments$/)
    await expectNoViolations(page)

    await page.getByRole('link', { name: 'Marcos', exact: true }).click()
    await expect(page).toHaveURL(/\/milestones$/)
    await expectNoViolations(page)
  })
})
