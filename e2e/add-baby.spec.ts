import { expect, test } from '@playwright/test'

import { addBaby, openAddBabyDialog, registerAndLogin, uniqueTestUser } from './support/fixtures.js'

test('a logged-in user with no children can add their first baby', async ({ page }) => {
  const user = uniqueTestUser('add-baby')
  await registerAndLogin(page, user)

  await openAddBabyDialog(page)

  await addBaby(page, { name: 'Alice E2E', birthDate: '2024-03-10', gender: 'Menina' })

  // O dashboard não tem mais um heading "Painel da Família" — depois da
  // reconstrução de navegação ele abre com a saudação, e a criança recém-criada
  // aparece na faixa da família. Asserir o nome **e** a ação de editar prova
  // que o registro existe de verdade, não só que algum texto foi pintado.
  await expect(page.getByRole('heading', { level: 1 })).toContainText(user.name)
  // `exact` não é preciosismo aqui. Desde que o calendário de vacinas voltou a
  // carregar (`cygnus-api` #17, 27/08/2026), o dashboard também lista doses
  // como "Alice E2E · 1ª dose" — o texto solto passou a casar com seis
  // elementos e virou violação de strict mode. O nome exato é o da faixa da
  // família, que é o que esta linha quer provar.
  await expect(page.getByText('Alice E2E', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Editar perfil de Alice E2E' })).toBeVisible()
})
