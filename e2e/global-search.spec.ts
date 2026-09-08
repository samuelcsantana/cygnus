import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { addBaby, openAddBabyDialog, registerAndLogin, uniqueTestUser } from './support/fixtures.js'

test('searches within a child, expands to family and reveals exact records in their pages', async ({
  page,
}) => {
  await registerAndLogin(page, uniqueTestUser('search'))
  await openAddBabyDialog(page)
  await addBaby(page, { name: 'Alice', birthDate: '2025-06-15', sexAtBirth: 'Feminino' })
  await page.getByRole('button', { name: 'Adicionar Filho', exact: true }).click()
  await addBaby(page, { name: 'Bruno', birthDate: '2024-05-01', sexAtBirth: 'Masculino' })
  const api = process.env.E2E_API_BASE_URL ?? 'http://localhost:3005'
  const cookies = await page.context().cookies(api)
  const csrf = cookies.find((cookie) => cookie.name === 'csrf_token')!.value
  const childrenResponse = await page.request.get(api + '/babies')
  const children = (await childrenResponse.json()) as { id: string; name: string }[]
  const alice = children.find((baby) => baby.name === 'Alice')!.id
  const bruno = children.find((baby) => baby.name === 'Bruno')!.id
  const post = async (path: string, data: object) => {
    const response = await page.request.post(api + path, {
      data,
      headers: { 'X-CSRF-Token': csrf },
    })
    expect(response.ok()).toBe(true)
  }
  for (const [id, name] of [
    [alice, 'Alice'],
    [bruno, 'Bruno'],
  ])
    await post(`/babies/${id}/milestones`, {
      title: `Passeio de ${name}`,
      category: 'SOCIAL',
      achievedAt: '2026-09-01',
      description: 'Uma lembrança especial.',
    })
  await post(`/babies/${alice}/medications`, {
    name: 'Registro especial',
    dosage: 'Conforme receita',
    frequency: 'Conforme receita',
    startedOn: '2026-09-01',
    endedOn: '2099-09-30',
  })
  await post(`/babies/${alice}/vaccines/adhoc`, {
    source: 'CUSTOM',
    customName: 'Vacina especial',
    customDose: 'Reforço',
    applicationDate: '2026-09-01',
  })
  for (let index = 0; index < 6; index++)
    await post(`/babies/${alice}/appointments`, {
      doctorName: `Dra. Fernanda ${index}`,
      scheduledAt: '2099-09-15T15:00:00Z',
      status: 'SCHEDULED',
      specialty: 'Pediatria',
      notes: 'Revisão especial',
    })
  await post('/specialists', { name: 'Dra. Camila', specialty: 'Pediatria', babyIds: [alice] })
  await page.reload()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}',
  })
  const header = page.getByRole('banner')
  await header.getByRole('button', { name: /Selecionar criança/ }).click()
  await page.getByRole('menuitemradio', { name: /Bruno/ }).click()
  const openSearch = async () => {
    await header.getByRole('button', { name: /Buscar|Abrir a busca/ }).click()
    await expect(page.getByRole('dialog').getByRole('searchbox')).toBeFocused()
  }
  await openSearch()
  const dialog = page.getByRole('dialog')
  const originalHeight = (await dialog.boundingBox())!.height
  await dialog.getByRole('searchbox').fill('passeio')
  await expect(dialog.getByRole('link', { name: /Passeio de Bruno/ })).toBeVisible()
  await expect(dialog.getByRole('link', { name: /Passeio de Alice/ })).toHaveCount(0)
  await dialog.getByRole('button', { name: /Buscar em:/ }).click()
  await page.screenshot({ path: 'docs/verification/search-scope-desktop.png' })
  await page.keyboard.press('Escape')
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('menu')).toBeHidden()
  await dialog.getByRole('button', { name: /Buscar em:/ }).click()
  await page.getByRole('menuitemradio', { name: 'Toda a família' }).click()
  await expect(dialog.getByRole('link', { name: /Passeio de Alice/ })).toBeVisible()
  expect((await dialog.boundingBox())!.height).toBe(originalHeight)
  await page.screenshot({ path: 'docs/verification/search-desktop.png' })
  expect((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations).toEqual(
    [],
  )
  await dialog.getByRole('link', { name: /Passeio de Alice/ }).click()
  await expect(page).toHaveURL(/\/milestones$/)
  await expect(page.getByRole('heading', { name: 'Passeio de Alice' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Passeio de Bruno' })).toHaveCount(0)
  await expect(page.getByText('Resultados da busca por “passeio”')).toBeVisible()
  await expect(header.getByRole('button', { name: /Selecionar criança.*Alice/ })).toBeVisible()
  await page.getByRole('button', { name: 'Voltar à lista completa' }).click()
  await openSearch()
  await dialog.getByRole('searchbox').fill('fernanda')
  await dialog.getByRole('link', { name: 'Ver os 6 resultados em Consultas' }).click()
  await expect(page).toHaveURL(/\/appointments$/)
  await expect(page.getByRole('heading', { name: /Dra. Fernanda/ })).toHaveCount(6)
  // A new search on the same page must clear its previous status filter.
  await page.getByRole('button', { name: /Canceladas/ }).click()
  await openSearch()
  await dialog.getByRole('searchbox').fill('fernanda 3')
  await page.keyboard.press('ArrowDown')
  await expect(dialog.getByRole('link', { name: /Fernanda 3/ })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Dra. Fernanda 3' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Dra. Fernanda/ })).toHaveCount(1)
  await page.getByRole('button', { name: /Canceladas/ }).click()
  await openSearch()
  await dialog.getByRole('searchbox').fill('fernanda 3')
  await dialog.getByRole('link', { name: /Fernanda 3/ }).click()
  await expect(page.getByRole('heading', { name: 'Dra. Fernanda 3' })).toBeVisible()
  for (const [query, path, title] of [
    ['registro especial', '/medications', 'Registro especial'],
    ['vacina especial', '/vaccines', 'Vacina especial'],
    ['camila', '/profissionais', 'Dra. Camila'],
  ]) {
    await openSearch()
    await dialog.getByRole('searchbox').fill(query!)
    await dialog.getByRole('link', { name: new RegExp(title!) }).click()
    await expect(page).toHaveURL(new RegExp(path! + '$'))
    await expect(page.getByText(title!, { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Voltar à lista completa' })).toBeVisible()
  }
  await openSearch()
  await dialog.getByRole('searchbox').fill('BCG')
  await dialog.getByRole('link', { name: /BCG/ }).first().click()
  await expect(page).toHaveURL(/\/vaccines$/)
  await expect(page.getByText('Resultados da busca por “BCG”')).toBeVisible()
  await expect(page.getByText('BCG', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Vacinas', exact: true }).click()
  await expect(page.getByText('Resultados da busca por “BCG”')).toHaveCount(0)
  await page.setViewportSize({ width: 375, height: 812 })
  await openSearch()
  await dialog.getByRole('searchbox').fill('especial')
  await expect(dialog.getByRole('link').first()).toBeVisible()
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.screenshot({ path: 'docs/verification/search-mobile.png' })
  await dialog.getByRole('button', { name: /Buscar em:/ }).click()
  await expect(page.getByRole('menu')).toBeVisible()
  await page.screenshot({ path: 'docs/verification/search-scope-mobile.png' })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.keyboard.press('Escape')
  await expect(dialog).toBeVisible()

  expect((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations).toEqual(
    [],
  )
  await dialog.getByRole('button', { name: 'Limpar busca' }).click()
  await expect(dialog.getByRole('searchbox')).toHaveValue('')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})
