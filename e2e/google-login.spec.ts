import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { registerAndLogin, uniqueTestUser } from './support/fixtures.js'

test('Google availability and cancellation are accessible and recoverable', async ({ page, baseURL }) => {
  await page.route('**/auth/google/status', route => route.fulfill({ json: { enabled: true } }))
  await page.route('**/auth/google/start', route => route.fulfill({ json: {
    url: 'https://accounts.google.com/o/oauth2/v2/auth?state=browser-test',
  } }))
  // Google itself is external. The API integration suite covers the real
  // callback handler; this interception exercises frontend full-page navigation.
  await page.route('https://accounts.google.com/o/oauth2/v2/auth?*', route => route.fulfill({
    status: 302, headers: { location: new URL('/auth/google/complete?error=failed', baseURL).toString() },
  }))
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar com Google' }).click()
  await expect(page).toHaveURL(/\/auth\/google\/complete\?error=failed$/)
  await expect(page.getByRole('alert')).toContainText('Não foi possível entrar')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('link', { name: 'Voltar para entrar' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.setViewportSize({ width: 375, height: 812 })
  await page.screenshot({ path: 'docs/verification/google-login-mobile.png', fullPage: true })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test('the completion page confirms the real cookie session before showing the dashboard', async ({ page }) => {
  await registerAndLogin(page, uniqueTestUser('google-completion'))
  // The existing login supplies a real local cookie session, without claiming
  // to exercise a live Google consent screen or requiring credentials in CI.
  await page.goto('/auth/google/complete')
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('button', { name: 'Adicionar meu primeiro filho' })).toBeVisible()
})
