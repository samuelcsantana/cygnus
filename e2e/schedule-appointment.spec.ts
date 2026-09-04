import { expect, test } from '@playwright/test'

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

  await page.getByLabel('Nome do Profissional').fill('Dra. E2E Teste')
  await page.getByRole('button', { name: 'Continuar' }).click()

  await page.getByLabel('Data').fill('2027-01-15')
  await page.getByLabel('Horário').fill('10:00')
  await page.getByRole('button', { name: 'Salvar Consulta' }).click()

  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByText('Dra. E2E Teste').first()).toBeVisible()
})
