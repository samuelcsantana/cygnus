import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { addBaby, openAddBabyDialog, registerAndLogin, uniqueTestUser } from './support/fixtures.js'

test('creates and edits a professional with explicit child access in a responsive dialog', async ({
  page,
}) => {
  await registerAndLogin(page, uniqueTestUser('specialist'))
  await openAddBabyDialog(page)
  await addBaby(page, { name: 'Alice', birthDate: '2025-06-15', sexAtBirth: 'Feminino' })
  await page.goto('/profissionais')
  await page.getByRole('button', { name: 'Adicionar Profissional', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}',
  })
  await dialog.getByLabel('Nome', { exact: true }).fill('Dra. Ana Silva')
  await dialog.getByLabel(/Especialidade/).fill('Pediatria')
  await dialog.getByLabel(/Telefone/).fill('(11) 99999-1234')
  await dialog.getByRole('checkbox', { name: 'Alice' }).check()
  await expect(
    dialog.getByText('Você e todos os responsáveis das crianças selecionadas.'),
  ).toBeVisible()
  const before = await dialog.boundingBox()
  await dialog.getByLabel('Nome', { exact: true }).scrollIntoViewIfNeeded()
  expect((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations).toEqual(
    [],
  )
  await page.screenshot({ path: 'docs/verification/specialist-desktop.png' })
  expect((await dialog.boundingBox())?.height).toBe(before?.height)
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  await page.screenshot({ path: 'docs/verification/specialist-mobile.png' })
  await dialog.getByRole('button', { name: 'Adicionar profissional', exact: true }).click()
  await expect(dialog).toBeHidden()
  await page.reload()
  await expect(page.getByRole('link', { name: '(11) 99999-1234' })).toHaveAttribute(
    'href',
    'tel:(11)99999-1234',
  )

  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}',
  })
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([])
  expect(await page.locator('body').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.screenshot({ path: 'docs/verification/specialists-page-mobile.png' })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.screenshot({ path: 'docs/verification/specialists-page-desktop.png' })
  await page.getByRole('searchbox').fill('999991234')
  await expect(page.getByRole('heading', { name: 'Dra. Ana Silva' })).toBeVisible()
  await page.getByRole('button', { name: 'Limpar busca' }).click()
  await page.getByRole('button', { name: /Editar.*Dra. Ana Silva/ }).click()
  await dialog.getByLabel(/Telefone/).clear()
  await dialog.getByRole('checkbox', { name: 'Alice' }).uncheck()
  await expect(
    dialog.getByText('Somente você. Este contato ficará na sua lista pessoal.'),
  ).toBeVisible()
  await dialog.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(dialog).toBeHidden()
  await page.reload()
  await expect(page.getByText('Só na sua lista', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '(11) 99999-1234' })).toHaveCount(0)
  await page.getByRole('button', { name: /Selecionar criança/ }).click()
  await page.getByRole('menuitemradio', { name: 'Alice', exact: true }).click()
  await expect(page.getByText(/Nenhum profissional vinculado a esta criança/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Dra. Ana Silva' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Ver todos os contatos' }).click()
  await expect(page.getByRole('heading', { name: 'Dra. Ana Silva' })).toBeVisible()
})
