import { expect, test } from '@playwright/test'

import { registerAndLogin, uniqueTestUser } from './support/fixtures.js'

test('a new user can register and log in', async ({ page }) => {
  const user = uniqueTestUser('login')

  await registerAndLogin(page, user)

  await expect(page.getByRole('button', { name: 'Cadastrar Primeiro Filho' })).toBeVisible()
})
