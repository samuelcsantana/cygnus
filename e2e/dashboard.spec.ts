import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { registerAndLogin, uniqueTestUser, openAddBabyDialog, addBaby } from './support/fixtures.js'
test('welcomes a family and guides its first records on desktop and mobile', async ({ page }) => {
  await registerAndLogin(page, uniqueTestUser('overview'))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.getByRole('button', { name: 'Adicionar meu primeiro filho' })).toBeVisible()
  await page.screenshot({ path: 'docs/verification/home-empty.png', fullPage: true })
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([])
  await openAddBabyDialog(page)
  await addBaby(page, { name: 'Alice', birthDate: '2025-06-15', sexAtBirth: 'Feminino' })
  await expect(page.getByRole('heading', { name: 'Comece por aqui' })).toBeVisible()
  await page.screenshot({ path: 'docs/verification/home-first.png', fullPage: true })
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([])
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.locator('body').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.screenshot({ path: 'docs/verification/home-mobile.png', fullPage: true })
  await page.getByRole('link', { name: 'Agendar uma consulta', exact: true }).click()
  await expect(page).toHaveURL(/appointments$/)
})
