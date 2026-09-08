import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

import { addBaby, openAddBabyDialog, registerAndLogin, uniqueTestUser } from './support/fixtures.js'

/**
 * Esteve `fixme` de 13/08 a 27/08/2026, enquanto o contrato de
 * GET /babies/{babyId}/vaccines divergia e `/vacinas` só alcançava o estado de
 * erro. Voltou a rodar quando a API passou a mandar o envelope
 * `{ metadata, groups }` (`cygnus-api` #17), e ao voltar mostrou que duas coisas
 * que este spec assumia deixaram de valer.
 *
 * **A data de nascimento passou a decidir se existe algo para aplicar.** O
 * catálogo 2026 vigora desde 29/07/2026, e a API nunca marca como pendente ou
 * atrasada uma dose cuja data prevista caia antes disso — ela vira `GUIDANCE`,
 * e a tela mostra "Orientação". A premissa antiga ("BCG aos 0 meses, então um
 * bebê recém-adicionado sempre a tem pendente") era verdadeira no catálogo
 * anterior e é falsa neste: um bebê com data fixa de 2025 tem o calendário
 * inteiro como orientação. Medido: nascido há 3 anos → 29 orientações, 5
 * pendentes, **0 atrasadas**. Daí a data ser calculada a partir de hoje.
 *
 * **A linha sai da primeira página ao ser aplicada.** A lista é paginada e
 * reordena as tomadas para o fim, então procurar "Aplicada em" na mesma linha
 * onde se clicou não acha nada — o filtro "Tomadas" é onde a confirmação está,
 * e é onde um usuário olharia.
 */
test('a user can log a vaccine as applied for their baby', async ({ page }) => {
  const user = uniqueTestUser('log-vaccine')
  await registerAndLogin(page, user)

  // Vinte dias atrás, calculado e não fixo: põe as doses do nascimento dentro
  // da vigência do catálogo, que é o que as torna acionáveis. Uma data fixa
  // envelheceria para fora dessa janela e levaria o spec junto.
  const nascimento = new Date()
  nascimento.setDate(nascimento.getDate() - 20)

  await openAddBabyDialog(page)
  await addBaby(page, {
    name: 'Bruno E2E',
    birthDate: nascimento.toISOString().slice(0, 10),
    sexAtBirth: 'Masculino',
  })

  await page.getByRole('link', { name: 'Vacinas', exact: true }).click()
  await expect(page).toHaveURL(/\/vaccines$/)

  const linhaBcg = page.getByRole('listitem').filter({ hasText: 'BCG' }).first()
  await expect(linhaBcg).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.screenshot({ path: 'docs/verification/vaccines-desktop.png' })
  await page.setViewportSize({ width: 375, height: 812 })
  await linhaBcg.getByText('Ver detalhes', { exact: true }).click()
  await expect(linhaBcg.locator('details')).toHaveAttribute('open', '')
  expect(await page.locator('body').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([])
  await page.screenshot({ path: 'docs/verification/vaccines-mobile.png' })
  await linhaBcg.getByRole('button', { name: 'Registrar dose' }).click()

  // Pelo nome, e não `getByRole('dialog')` solto: o seletor de data dentro do
  // diálogo é um popover do Radix que também carrega `role="dialog"` e fica no
  // DOM depois de fechado. Duas casadas é violação de strict mode, e falha
  // independente de visibilidade — a asserção nunca teria como passar.
  const dialogo = page.getByRole('dialog', { name: 'Aplicar Vacina' })
  await expect(dialogo).toBeVisible()
  await dialogo.getByLabel(/Lote/).fill('AB-123')
  await dialogo.getByRole('button', { name: 'Salvar Registro' }).click()
  await expect(dialogo).not.toBeVisible()

  await page.getByRole('button', { name: /^Tomadas/ }).click()
  await expect(
    page
      .getByRole('listitem')
      .filter({ hasText: 'BCG' })
      .getByText(/^Aplicada em/),
  ).toBeVisible()
  const search = page.getByRole('searchbox')
  await search.fill('bcg')
  await expect(page.getByRole('status').filter({ hasText: '1 resultado' })).toBeVisible()
  await page.getByRole('button', { name: 'Limpar busca' }).click()
  await expect(search).toBeFocused()
  await page.getByRole('link', { name: 'Ver carteira de Bruno E2E' }).click()
  await expect(page.getByRole('heading', { name: 'Bruno E2E', exact: true })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Somente doses aplicadas' })).toBeChecked()
  expect(await page.locator('body').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([])
  await page.getByText('Detalhes do registro', { exact: true }).click()
  await expect(page.getByText('AB-123').first()).toBeVisible()
  await page.getByRole('link', {name:'Voltar às vacinas'}).scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'docs/verification/card-mobile.png' })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.getByRole('link', {name:'Voltar às vacinas'}).scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'docs/verification/card-desktop.png' })
  await page.emulateMedia({ media: 'print' })
  await expect(page.getByRole('heading', { name: /Calendário a acompanhar/ })).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Bruno E2E', exact: true })).toBeVisible()
  await page.pdf({ path: 'docs/verification/card-applied.pdf', preferCSSPageSize: true })
  await page.screenshot({ path: 'docs/verification/card-print.png' })
  await page.emulateMedia({ media: 'screen' })
  await page.getByRole('radio', { name: 'Incluir calendário a acompanhar' }).check()
  await page.emulateMedia({ media: 'print' })
  await expect(page.getByRole('heading', { name: /Calendário a acompanhar/ })).toBeVisible()
  await page.pdf({ path: 'docs/verification/card-complete.pdf', preferCSSPageSize: true })
  await page.emulateMedia({ media: 'screen' })
})
