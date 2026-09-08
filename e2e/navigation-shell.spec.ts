import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { addBaby, openAddBabyDialog, registerAndLogin, uniqueTestUser } from './support/fixtures.js'

test('keeps family context visible across pages and provides an accessible mobile menu', async ({
  page,
}) => {
  await registerAndLogin(page, uniqueTestUser('navigation'))
  await page.getByRole('link', { name: 'Profissionais', exact: true }).click()
  await expect(page).toHaveURL(/\/profissionais$/)
  await page.getByRole('link', { name: 'Visão geral', exact: true }).click()
  await openAddBabyDialog(page)
  await addBaby(page, { name: 'Alice', birthDate: '2025-06-15', sexAtBirth: 'Feminino' })
  await page.getByRole('button', { name: 'Adicionar Filho', exact: true }).click()
  await addBaby(page, { name: 'Bruno', birthDate: '2024-05-01', sexAtBirth: 'Masculino' })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}',
  })
  const header = page.getByRole('banner')
  await expect(page.getByRole('button', { name: /Selecionar criança/ })).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Conta e preferências' })).toHaveCount(1)
  await expect(header.getByText('Ninho', { exact: true })).toHaveCount(0)
  await header.getByRole('button', { name: /Selecionar criança/ }).click()
  await page.screenshot({ path: 'docs/verification/selector-desktop.png' })
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([])
  await page.getByRole('menuitemradio', { name: /Alice/ }).click()
  await expect(header.getByRole('button', { name: /Selecionar criança.*Alice/ })).toBeVisible()
  await page.getByRole('link', { name: 'Marcos', exact: true }).click()
  await expect(header.getByRole('button', { name: /Selecionar criança.*Alice/ })).toBeVisible()
  await page.screenshot({ path: 'docs/verification/navigation-desktop.png' })
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([])
  await header.getByRole('button', { name: 'Conta e preferências' }).click()
  await expect(page.getByRole('button', { name: 'Sair da conta' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Meu perfil' })).toBeVisible()
  await page.screenshot({ path: 'docs/verification/account-menu-desktop.png' })
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([])
  await page.keyboard.press('Escape')
  await page.setViewportSize({ width: 375, height: 812 })
  await expect(header.getByRole('button', { name: 'Conta e preferências' })).toHaveCount(0)
  await page.screenshot({ path: 'docs/verification/navigation-mobile-header.png' })
  expect(await page.locator('body').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await header.getByRole('button', { name: 'Abrir menu' }).click()
  const drawer = page.getByRole('dialog', { name: 'Seções' })
  await expect(drawer.getByRole('button', { name: /Selecionar criança/ })).toHaveCount(0)
  await expect(drawer.getByRole('button', { name: 'Conta e preferências' })).toHaveCount(1)
  await page.screenshot({ path: 'docs/verification/navigation-mobile-menu.png' })
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([])
  await drawer.getByRole('link', { name: 'Medicamentos', exact: true }).click()
  await expect(drawer).toBeHidden()
  await header.getByRole('button', { name: /Selecionar criança/ }).click()
  await expect(page.getByRole('menuitemradio', { name: 'Alice', exact: true })).toBeFocused()
  await page.screenshot({ path: 'docs/verification/selector-mobile.png' })
  await page.getByRole('menuitemradio', { name: 'Todas as crianças', exact: true }).click()
  await expect(header.getByRole('button', { name: /Todas as crianças/ })).toBeVisible()
  await page.setViewportSize({ width: 568, height: 360 })
  await header.getByRole('button', { name: 'Abrir menu' }).click()
  await drawer.getByRole('button', { name: 'Conta e preferências' }).click()
  await page.screenshot({ path: 'docs/verification/account-menu-mobile.png' })
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([])
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await expect(page).toHaveURL(/\/login$/)
})
