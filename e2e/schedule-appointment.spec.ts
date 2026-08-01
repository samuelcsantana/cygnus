import { expect, test } from '@playwright/test'

import { addBaby, registerAndLogin, uniqueTestUser } from './support/fixtures.js'

test('a user can schedule an appointment for their baby', async ({ page }) => {
  const user = uniqueTestUser('schedule-appointment')
  await registerAndLogin(page, user)

  await page.getByRole('link', { name: 'Começar Agora: Adicionar Criança' }).click()
  await addBaby(page, { name: 'Clara E2E', birthDate: '2025-06-15', gender: 'Menina' })

  await page.getByRole('link', { name: 'Consultas', exact: true }).click()
  await expect(page).toHaveURL(/\/appointments$/)

  await page.getByRole('link', { name: 'Agendar Consulta' }).click()
  await expect(page).toHaveURL(/\/appointments\/new$/)

  await page.getByLabel('Nome do Profissional').fill('Dra. E2E Teste')
  await page.getByLabel('Data').fill('2027-01-15')
  await page.getByLabel('Horário').fill('10:00')
  await page.getByRole('button', { name: 'Salvar Consulta' }).click()

  await expect(page).toHaveURL(/\/appointments$/)
  await expect(page.getByRole('heading', { name: 'Dra. E2E Teste' })).toBeVisible()
})
