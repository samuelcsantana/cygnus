import { expect, test } from '@playwright/test'

import { addBaby, openAddBabyDialog, registerAndLogin, uniqueTestUser } from './support/fixtures.js'

/**
 * Bloqueado, não desatualizado — e a diferença importa.
 *
 * O calendário de vacinas não carrega desde 13/08/2026: o front exige
 * `guidance`, `recommendationKind` e um envelope `{ metadata, groups }` que a
 * API não manda, então o parse Zod rejeita uma resposta 200 e `/vacinas` fica
 * no estado de erro. Sem uma linha de vacina na tela não há o que marcar como
 * aplicada, e **não dá para saber se os seletores deste spec ainda servem**
 * enquanto o dado não voltar.
 *
 * `fixme` em vez de deixar vermelho de propósito: uma suíte com uma falha
 * permanente ensina todo mundo a ignorar a suíte. Remover o `fixme` é o
 * primeiro teste de que o contrato foi consertado.
 */
test.fixme('a user can log a vaccine as applied for their baby', async ({ page }) => {
  const user = uniqueTestUser('log-vaccine')
  await registerAndLogin(page, user)

  await openAddBabyDialog(page)
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
