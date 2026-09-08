import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { addBaby, openAddBabyDialog, registerAndLogin, uniqueTestUser } from './support/fixtures.js'

test('saves a memory with its photo, retains the draft between steps and edits it', async ({
  page,
}) => {
  await registerAndLogin(page, uniqueTestUser('memory'))
  await openAddBabyDialog(page)
  await addBaby(page, { name: 'Alice', birthDate: '2025-06-15', sexAtBirth: 'Feminino' })
  await page.goto('/milestones')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}',
  })
  await page
    .getByRole('button', {
      name: /Adicionar Marco|Novo Marco|Registrar Marco|Registrar Primeiro Marco|Registrar agora/i,
    })
    .click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('O que aconteceu?').fill('Um passeio inesquecível')
  await dialog.getByLabel('Data', { exact: true }).fill('2026-09-01')
  await dialog.getByRole('radio', { name: /Social/ }).click()
  const before = await dialog.boundingBox()
  expect((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations).toEqual(
    [],
  )
  await page.screenshot({ path: 'docs/verification/milestone-moment.png' })
  await dialog.getByRole('button', { name: 'Continuar' }).click()
  expect((await dialog.boundingBox())?.height).toBe(before?.height)
  await dialog
    .getByLabel('Como foi esse momento? (opcional)')
    .fill('Descobrimos as flores do jardim juntos.')
  const photo = await page.screenshot({ clip: { x: 0, y: 0, width: 120, height: 120 } })
  let uploads = 0
  page.on('request', (request) => {
    if (request.url().endsWith('/uploads/milestone-photos')) uploads++
  })
  await dialog
    .locator('input[type=file]')
    .setInputFiles({ name: 'memory.png', mimeType: 'image/png', buffer: photo })
  expect(uploads).toBe(0)
  await dialog.getByRole('button', { name: 'Voltar' }).click()
  await dialog.getByRole('button', { name: 'Continuar' }).click()
  await expect(dialog.getByRole('button', { name: 'Trocar foto' })).toBeVisible()
  await page.screenshot({ path: 'docs/verification/milestone-memory.png' })
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  expect((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations).toEqual(
    [],
  )
  await page.screenshot({ path: 'docs/verification/milestone-mobile.png' })
  let releaseUpload!: () => void
  const uploadGate = new Promise<void>((resolve) => {
    releaseUpload = resolve
  })
  await page.route('**/uploads/milestone-photos', async (route) => {
    await uploadGate
    await route.continue()
  })
  let attempts = 0
  await page.route('**/babies/*/milestones', async (route) => {
    if (route.request().method() === 'POST' && ++attempts === 1)
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    else await route.continue()
  })
  await dialog.getByRole('button', { name: 'Guardar lembrança' }).click()
  await expect(dialog.getByRole('button', { name: 'Enviando foto…' })).toBeDisabled()
  await expect(dialog.getByRole('button', { name: 'Fechar' })).toBeDisabled()
  releaseUpload()
  await expect(dialog.getByRole('alert')).toBeVisible()
  const savedResponse = page.waitForResponse(
    (response) => response.url().endsWith('/milestones') && response.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Guardar lembrança' }).click()
  const saved = await savedResponse
  expect(saved.status()).toBe(201)
  expect((await saved.json()).photoUrl).toBeTruthy()
  expect(uploads).toBe(1)
  await expect(dialog).toBeHidden()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Um passeio inesquecível' })).toBeVisible()
  const photoButton = page.getByRole('button', { name: 'Ampliar foto de Um passeio inesquecível' })
  await expect(photoButton.locator('img')).toBeVisible()
  expect(
    await photoButton.locator('img').evaluate((el) => {
      const img = el as unknown as { complete: boolean; naturalWidth: number }
      return img.complete && img.naturalWidth > 0
    }),
  ).toBe(true)
  await photoButton.click()
  await expect(dialog.getByRole('img')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await page.getByRole('searchbox', { name: 'Buscar nas memórias…' }).fill('inesquecivel')
  await expect(page.getByRole('heading', { name: 'Um passeio inesquecível' })).toBeVisible()
  expect(await page.locator('body').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.screenshot({ path: 'docs/verification/milestones-page-mobile.png', fullPage: true })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.screenshot({ path: 'docs/verification/milestones-page-desktop.png', fullPage: true })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('button', { name: /Editar.*Um passeio inesquecível/ }).click()
  await dialog.getByRole('button', { name: 'Continuar' }).click()
  await expect(dialog.getByRole('button', { name: 'Trocar foto' })).toBeVisible()
  await dialog.getByLabel('Como foi esse momento? (opcional)').fill('Uma tarde com a família.')
  await dialog.getByRole('button', { name: 'Salvar Alterações' }).click()
  await expect(dialog).toBeHidden()
  await page.reload()
  await expect(page.getByText('Uma tarde com a família.', { exact: true })).toBeVisible()
})
