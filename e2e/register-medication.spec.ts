import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { addBaby, openAddBabyDialog, registerAndLogin, uniqueTestUser } from './support/fixtures.js'

test('records, edits and deletes a medication with a stable responsive editor', async ({
  page,
}) => {
  const dateAt = (offset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  await registerAndLogin(page, uniqueTestUser('medication'))
  await openAddBabyDialog(page)
  await addBaby(page, { name: 'Alice', birthDate: '2025-06-15', sexAtBirth: 'Feminino' })
  await page.goto('/medications')
  await page.getByRole('button', { name: 'Registrar Medicamento', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}',
  })
  await dialog.getByLabel('Medicamento', { exact: true }).fill('Registro de teste')
  await dialog.getByLabel('Dose (Opcional)').fill('Conforme receita')
  await dialog.getByLabel('Frequência (Opcional)').fill('Conforme receita')
  const before = await dialog.boundingBox()
  expect((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations).toEqual(
    [],
  )
  await page.screenshot({ path: 'docs/verification/medication-medicine.png' })
  await dialog.getByRole('button', { name: 'Continuar' }).click()
  expect((await dialog.boundingBox())?.height).toBe(before?.height)
  await dialog.getByLabel('Início', { exact: true }).fill(dateAt(1))
  await page.keyboard.press('Escape')
  await dialog.getByLabel('Fim (Opcional)').fill(dateAt(23))
  await page.keyboard.press('Escape')
  await dialog.getByLabel('Quem receitou (Opcional)').fill('Dra. Ana Silva')
  await dialog.getByLabel('Observações (Opcional)').fill('Anotação de teste')
  expect((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations).toEqual(
    [],
  )
  await page.screenshot({ path: 'docs/verification/medication-details.png' })
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.screenshot({ path: 'docs/verification/medication-mobile.png' })
  await dialog.getByRole('button', { name: 'Salvar Registro' }).click()
  await expect(dialog).toBeHidden()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Registro de teste' })).toBeVisible()

  await expect(page.getByText('Programado', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Registrar término', exact: true })).toHaveCount(0)
  await page.goto('/dashboard')
  await expect(page.getByText('Programado', { exact: true })).toBeVisible()
  await page.goto('/medications')
  await page.getByRole('button', { name: 'Editar', exact: true }).click()
  await dialog.getByRole('button', { name: 'Continuar' }).click()
  await dialog.getByLabel('Início', { exact: true }).fill(dateAt(0))
  await page.keyboard.press('Escape')
  await dialog.getByRole('button', { name: 'Salvar Alterações' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Em andamento', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Registrar término', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar término hoje', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toBeHidden()
  await expect(page.getByText('Termina hoje', { exact: true })).toBeVisible()
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([])
  await page.screenshot({ path: 'docs/verification/medications-page-mobile.png' })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.screenshot({ path: 'docs/verification/medications-page-desktop.png' })
  await page.getByRole('button', { name: 'Editar', exact: true }).click()
  await dialog.getByLabel('Dose (Opcional)').clear()
  await dialog.getByRole('button', { name: 'Continuar' }).click()
  await dialog.getByLabel('Início', { exact: true }).fill(dateAt(-6))
  await page.keyboard.press('Escape')
  await dialog.getByLabel('Fim (Opcional)').fill(dateAt(-5))
  await page.keyboard.press('Escape')
  await dialog.getByLabel('Observações (Opcional)').fill('Registro revisado')
  await dialog.getByRole('button', { name: 'Salvar Alterações' }).click()
  await expect(dialog).toBeHidden()
  await page.reload()
  await expect(page.getByText('Encerrado', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Editar', exact: true }).click()
  await dialog.getByRole('button', { name: 'Continuar' }).click()
  await expect(dialog.getByLabel('Observações (Opcional)')).toHaveValue('Registro revisado')
  await dialog.getByRole('button', { name: 'Excluir registro' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Excluir', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Registro de teste' })).toHaveCount(0)
})
