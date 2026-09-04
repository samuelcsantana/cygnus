import { expect, type Page } from '@playwright/test'

export interface TestUser {
  name: string
  email: string
  password: string
}

/** Unique per test run so parallel/repeated runs never collide on email. */
export function uniqueTestUser(label: string): TestUser {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 100000)}`
  return {
    name: `E2E ${label}`,
    email: `e2e-${label}-${stamp}@example.com`,
    password: 'S3cur3-Password',
  }
}

/**
 * POST /auth/register never authenticates the user — it creates the account
 * and returns no session — so this always goes through both screens: register, then
 * log in — exactly like a real first-time user would.
 */
export async function registerAndLogin(page: Page, user: TestUser): Promise<void> {
  // `exact: true` on the password fields: getByLabel matches substrings, and
  // both auth forms carry a reveal toggle labelled "Mostrar senha" /
  // "Ocultar senha", which a loose match would pick up as a second element.
  await page.goto('/register')
  await page.getByLabel('Nome completo').fill(user.name)
  await page.getByLabel('E-mail').fill(user.email)
  await page.getByLabel('Senha', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: 'Criar conta gratuitamente' }).click()

  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel('E-mail').fill(user.email)
  await page.getByLabel('Senha', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: 'Entrar na Conta' }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
}

export interface TestBaby {
  name: string
  birthDate: string
  sexAtBirth: 'Masculino' | 'Feminino'
}

/**
 * Opens the "add child" dialog from the dashboard's empty state.
 *
 * There is no `/add-baby` route any more: the navigation rebuild replaced it
 * with a dialog, so the flow never leaves `/dashboard`. The specs asserted a
 * URL change here and were failing against an app that had simply stopped
 * navigating.
 */
export async function openAddBabyDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Cadastrar Primeiro Filho' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

/**
 * Fills and submits the "add child" dialog, which must already be open.
 *
 * **Two steps, not one.** The dialog is a wizard — "Perfil" then "Saúde" — and
 * "Criar Perfil" only exists on the second. The specs clicked it straight after
 * filling the name and waited 30s for a button that was one screen away.
 * The health step is all optional fields, so it is submitted as it comes.
 */
export async function addBaby(page: Page, baby: TestBaby): Promise<void> {
  await page.getByLabel('Nome da Criança').fill(baby.name)
  await page.getByLabel('Data de Nascimento').fill(baby.birthDate)
  // Digitar a data abre o calendário, e ele fica sobre os campos de baixo — o clique seguinte era
  // interceptado pelo popover, não pelo alvo. Passou despercebido enquanto o campo de sexo tinha
  // duas opções e o alvo caía fora da sobreposição; com três, cai debaixo dela. Fechar o calendário
  // é o que o usuário faz sem pensar e o que o teste precisava fazer explicitamente.
  await page.keyboard.press('Escape')
  await page.getByRole('radio', { name: baby.sexAtBirth }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await page.getByRole('button', { name: 'Criar Perfil' }).click()

  // O diálogo fechar é o sinal de sucesso — não há navegação para esperar.
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page).toHaveURL(/\/dashboard$/)
}
