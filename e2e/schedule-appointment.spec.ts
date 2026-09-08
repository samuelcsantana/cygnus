import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

import { addBaby, openAddBabyDialog, registerAndLogin, uniqueTestUser } from './support/fixtures.js'

test('a user can schedule an appointment for their baby', async ({ page }) => {
  const user = uniqueTestUser('schedule-appointment')
  await registerAndLogin(page, user)

  await openAddBabyDialog(page)
  await addBaby(page, { name: 'Clara E2E', birthDate: '2025-06-15', sexAtBirth: 'Feminino' })

  await page.getByRole('link', { name: 'Consultas', exact: true }).click()
  await expect(page).toHaveURL(/\/appointments$/)

  // Botão que abre um diálogo, não link para `/appointments/new`: essa rota
  // deixou de existir na reconstrução de navegação, e o formulário virou um
  // assistente. Com um único filho o passo "de quem?" some sozinho, então o
  // diálogo abre direto no profissional.
  await page.getByRole('button', { name: 'Agendar Consulta' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}',
  })
  const dialog = page.getByRole('dialog')

  await page.getByLabel('Nome do Profissional').fill('Dra. E2E Teste')
  await page.getByLabel('Especialidade (Opcional)').fill('Pediatria')
  await page.getByLabel('Local (Opcional)').fill('Clínica Jardim')
  await page.screenshot({ path: 'docs/verification/appointment-professional.png' })
  const before = await dialog.boundingBox()
  await page.getByRole('button', { name: 'Continuar' }).click()
  expect((await dialog.boundingBox())?.height).toBe(before?.height)

  await page.getByLabel('Data', { exact: true }).fill('2027-01-15')
  await page.getByLabel('Horário').fill('10:00')
  expect((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations).toEqual(
    [],
  )
  await page.screenshot({ path: 'docs/verification/appointment-schedule.png' })
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.screenshot({ path: 'docs/verification/appointment-mobile.png' })
  await page.getByRole('button', { name: 'Agendar consulta' }).click()

  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByText('Dra. E2E Teste').first()).toBeVisible()
  await page.getByRole('button', { name: 'Reagendar', exact: true }).click()
  await expect(page.getByLabel('Data', { exact: true })).toHaveValue('15-01-2027')
  await expect(page.getByRole('radio')).toHaveCount(0)
  await page.getByLabel('Horário').fill('14:30')
  await page.getByRole('button', { name: 'Salvar Alterações' }).click()
  await expect(dialog).toBeHidden()
  await page.reload()
  await expect(page.getByText(/14:30/).first()).toBeVisible()
  await page.screenshot({ path: 'docs/verification/appointments-list-mobile.png' })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.screenshot({ path: 'docs/verification/appointments-list-desktop.png' })
  await expect(page.getByRole('button', { name: 'Próximas (1)' })).toBeVisible()
  await page.getByRole('button', { name: 'Ver Detalhes', exact: true }).click()
  await expect(dialog.getByText('Clara E2E', { exact: false })).toBeVisible()
  await expect(dialog.getByText('Clínica Jardim', { exact: true })).toBeVisible()
  expect(
    (
      await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([])
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.screenshot({ path: 'docs/verification/appointments-detail-mobile.png' })
  await page.getByRole('button', { name: 'Cancelar Consulta', exact: true }).click()
  await page.getByRole('button', { name: 'Sim, cancelar consulta', exact: true }).click()
  await expect(dialog).toBeHidden()
  await page.getByRole('button', { name: 'Canceladas (1)' }).click()
  await expect(page.getByText('Dra. E2E Teste')).toBeVisible()
  await page.getByRole('button', { name: 'Ver Detalhes', exact: true }).click()
  await expect(dialog.getByLabel(/Peso/)).toHaveCount(0)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Registrar consulta realizada', exact: true }).click()
  await page.getByLabel('Nome do Profissional').fill('Dra. Histórico')
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Registrar consulta', exact: true })).toBeVisible()
  await page.getByLabel('Data', { exact: true }).fill('2026-08-15')
  await page.keyboard.press('Escape')
  await page.getByLabel('Horário').fill('10:00')
  await page.getByRole('button', { name: 'Registrar consulta', exact: true }).click()
  await expect(dialog).toBeHidden()
  await page.getByRole('button', { name: 'Realizadas (1)' }).click()
  await expect(page.getByText('Dra. Histórico')).toBeVisible()
})
