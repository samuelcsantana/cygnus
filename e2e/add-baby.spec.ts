import { expect, test } from '@playwright/test'

import { addBaby, registerAndLogin, uniqueTestUser } from './support/fixtures.js'

test('a logged-in user with no children can add their first baby', async ({ page }) => {
  const user = uniqueTestUser('add-baby')
  await registerAndLogin(page, user)

  await page.getByRole('link', { name: 'Começar Agora: Adicionar Criança' }).click()
  await expect(page).toHaveURL(/\/add-baby$/)

  await addBaby(page, { name: 'Alice E2E', birthDate: '2024-03-10', gender: 'Menina' })

  await expect(page.getByRole('heading', { name: 'Painel da Família' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Alice E2E \d+ mes/ })).toBeVisible()
})
