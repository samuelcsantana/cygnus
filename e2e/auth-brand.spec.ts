import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

test('auth branding stays compact and accessible across forms, sizes and themes', async ({ page }) => {
  let releaseStatus!: () => void
  const statusReady = new Promise<void>((resolve) => { releaseStatus = resolve })
  await page.route('**/auth/google/status', async (route) => {
    await statusReady
    await route.fulfill({ json: { enabled: true } })
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/login')
  await expect(page.getByRole('button', { name: 'Carregando login com Google…' })).toBeDisabled()
  releaseStatus()
  await expect(page.getByRole('button', { name: 'Continuar com Google' })).toBeEnabled()
  for (const [name, width, height, colorScheme] of [
    ['desktop', 1440, 1000, 'light'],
    ['mobile', 375, 812, 'light'],
    ['mobile-dark', 375, 812, 'dark'],
    ['desktop-dark', 1440, 1000, 'dark'],
  ] as const) {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ colorScheme })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bem-vindo(a) de volta')
    await expect(page.getByRole('link', { name: 'Cadastre-se' })).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Entrar na Conta' })).toBeInViewport()
    await expect(page.getByRole('button', { name: 'Continuar com Google' })).toBeInViewport()
    expect(await page.evaluate('document.documentElement.scrollWidth <= innerWidth')).toBe(true)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.screenshot({ path: `docs/verification/auth-brand-${name}.png`, fullPage: true })
  }
  await page.setViewportSize({ width: 360, height: 800 })
  await page.emulateMedia({ colorScheme: 'light' })
  await page.getByRole('link', { name: 'Cadastre-se' }).click()
  await expect(page.getByRole('heading', { name: 'Crie sua conta' })).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  expect(await page.evaluate('document.documentElement.scrollWidth <= innerWidth')).toBe(true)
  await page.screenshot({ path: 'docs/verification/auth-brand-register.png', fullPage: true })
  await page.getByRole('link', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Bem-vindo(a) de volta' })).toBeVisible()
  await page.getByLabel('E-mail', { exact: true }).fill('parent@example.com')
  await page.getByRole('button', { name: 'Esqueci minha senha' }).click()
  await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue('parent@example.com')
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})
