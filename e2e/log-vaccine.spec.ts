import { expect, test } from '@playwright/test'

import { addBaby, registerAndLogin, uniqueTestUser } from './support/fixtures.js'

test('a user can log a vaccine as applied for their baby', async ({ page }) => {
  const user = uniqueTestUser('log-vaccine')
  await registerAndLogin(page, user)

  await page.getByRole('link', { name: 'Começar Agora: Adicionar Criança' }).click()
  await addBaby(page, { name: 'Bruno E2E', birthDate: '2025-01-01', gender: 'Menino' })

  await page.getByRole('link', { name: 'Vacinas', exact: true }).click()
  await expect(page).toHaveURL(/\/vaccines$/)

  // BCG is recommended at 0 months, so a freshly-added baby always has it
  // pending/overdue — a reliable target regardless of the exact birth date.
  const bcgRow = page.getByRole('listitem').filter({ hasText: 'BCG' })
  await bcgRow.getByRole('button').click()

  await expect(page.getByRole('dialog', { name: 'Aplicar Vacina' })).toBeVisible()
  await page.getByRole('button', { name: 'Salvar Registro' }).click()

  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(bcgRow.getByText(/^Aplicada em/)).toBeVisible()
})
