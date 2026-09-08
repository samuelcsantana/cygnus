import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { registerAndLogin, uniqueTestUser } from './support/fixtures.js'
test('keeps account email read-only while saving the name', async ({ page }) => {
  const user = uniqueTestUser('profile')
  await registerAndLogin(page, user)
  await page.goto('/profile')
  const email = page.getByLabel('E-mail', { exact: true })
  await expect(email).toHaveAttribute('readonly', '')
  await expect(email).toHaveValue(user.email)
  await expect(
    page.getByRole('heading', { name: /Cadastros da Conta|Bebês que você gerencia/i }),
  ).toHaveCount(0)
  await page.getByLabel('Nome completo').fill('Nome atualizado')
  const saved = page.waitForResponse(
    (response) => response.url().endsWith('/users/me') && response.request().method() === 'PATCH',
  )
  await page.getByRole('button', { name: 'Salvar Alterações', exact: true }).click()
  const response = await saved
  expect(response.ok()).toBe(true)
  expect(response.request().postDataJSON()).toEqual({ name: 'Nome atualizado' })
  await page.reload()
  await expect(page.getByLabel('Nome completo')).toHaveValue('Nome atualizado')
  await expect(email).toHaveValue(user.email)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}',
  })
  const firstPhoto = await page.screenshot({ clip: { x: 0, y: 0, width: 80, height: 80 } })
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'profile.png', mimeType: 'image/png', buffer: firstPhoto })
  await expect(page.getByRole('button', { name: 'Trocar foto' })).toBeVisible()
  const savePhoto = page.waitForResponse(
    (response) => response.url().endsWith('/users/me') && response.request().method() === 'PATCH',
  )
  await page.getByRole('button', { name: 'Salvar Alterações', exact: true }).click()
  const photoResponse = await savePhoto
  const photoUrl = (await photoResponse.json()).avatarUrl
  expect(photoUrl).toMatch(/^data:image\/jpeg;base64,/)
  await page.reload()
  await expect(page.locator('[data-testid="avatar-preview"] img')).toHaveAttribute('src', photoUrl)
  await expect(page.getByRole('banner').locator('img')).toHaveAttribute('src', photoUrl)
  await expect(page.getByRole('button', { name: 'Salvar Alterações', exact: true })).toBeDisabled()
  const secondPhoto = await page.screenshot({ clip: { x: 16, y: 16, width: 64, height: 64 } })
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'new-profile.png', mimeType: 'image/png', buffer: secondPhoto })
  const replacePhoto = page.waitForResponse(
    (response) => response.url().endsWith('/users/me') && response.request().method() === 'PATCH',
  )
  await page.getByRole('button', { name: 'Salvar Alterações', exact: true }).click()
  const replaced = (await (await replacePhoto).json()).avatarUrl
  expect(replaced).not.toBe(photoUrl)
  await page.getByRole('button', { name: 'Trocar senha' }).click()
  await page.getByLabel('Senha atual', { exact: true }).fill(user.password)
  await page.getByLabel('Nova senha', { exact: true }).fill('N3w-Password-Profile')
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('N3w-Password-Profile')
  await page.getByRole('button', { name: 'Mostrar senha' }).first().click()
  await expect(page.getByLabel('Senha atual', { exact: true })).toHaveAttribute('type', 'text')
  const passwordSaved = page.waitForResponse(
    (response) => response.url().endsWith('/users/me') && response.request().method() === 'PATCH',
  )
  await page.getByRole('button', { name: 'Atualizar Senha' }).click()
  expect((await passwordSaved).ok()).toBe(true)
  await expect(page.getByRole('button', { name: 'Trocar senha' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('banner').locator('img')).toHaveAttribute('src', replaced)
  await page.screenshot({ path: 'docs/verification/profile-redesign-desktop.png', fullPage: true })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.locator('body').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.screenshot({ path: 'docs/verification/profile-mobile.png', fullPage: true })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('button', { name: 'Remover foto' }).click()
  const removed = page.waitForResponse(
    (response) => response.url().endsWith('/users/me') && response.request().method() === 'PATCH',
  )
  await page.getByRole('button', { name: 'Salvar Alterações', exact: true }).click()
  expect((await (await removed).json()).avatarUrl).toBeNull()
  await page.reload()
  await expect(page.locator('[data-testid="avatar-preview"] img')).toHaveCount(0)
  await expect(email).toHaveValue(user.email)
})
