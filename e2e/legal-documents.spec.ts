import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { registerAndLogin, uniqueTestUser } from './support/fixtures.js'

test('active web legal documents are public and versioned acceptance survives reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const path of ['/termos', '/privacidade']) {
    await page.goto(path)
    await expect(page.getByText('Versão 1.0.0 · em vigor a partir de 08/09/2026')).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(12)
    await expect(page.getByText(/samuel.ssa89@gmail.com/).first()).toBeVisible()
    await expect(page.getByText(/minuta|ainda precisa de revisão profissional/i)).toHaveCount(0)
    for (const [width, colorScheme] of [[1440, 'light'], [375, 'dark']] as const) {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ colorScheme })
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
      expect(await page.evaluate('document.documentElement.scrollWidth <= innerWidth')).toBe(true)
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 })
  await registerAndLogin(page, uniqueTestUser('legal'))
  await page.reload()
  await expect(page.getByRole('button', { name: 'Adicionar meu primeiro filho' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Antes de continuar' })).toHaveCount(0)
  const response = await page.request.get((process.env.E2E_API_BASE_URL ?? 'http://localhost:3005') + '/legal/acceptances')
  expect(response.ok()).toBe(true)
  expect(await response.json()).toEqual(expect.arrayContaining([
    expect.objectContaining({ documentId: 'privacy', version: '1.0.0' }),
    expect.objectContaining({ documentId: 'terms', version: '1.0.0' }),
  ]))
})
