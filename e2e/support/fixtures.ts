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
 * POST /auth/register never authenticates the user (see cygnus-api
 * CLAUDE.md), so this always goes through both screens — register, then
 * log in — exactly like a real first-time user would.
 */
export async function registerAndLogin(page: Page, user: TestUser): Promise<void> {
  await page.goto('/register')
  await page.getByLabel('Nome completo').fill(user.name)
  await page.getByLabel('E-mail').fill(user.email)
  await page.getByLabel('Senha').fill(user.password)
  await page.getByRole('button', { name: 'Criar Conta' }).click()

  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel('E-mail').fill(user.email)
  await page.getByLabel('Senha').fill(user.password)
  await page.getByRole('button', { name: 'Entrar na Conta' }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
}

export interface TestBaby {
  name: string
  birthDate: string
  gender: 'Menino' | 'Menina'
}

/** Runs from /add-baby (either the empty-state redirect or a direct nav). */
export async function addBaby(page: Page, baby: TestBaby): Promise<void> {
  await page.getByLabel('Nome da Criança').fill(baby.name)
  await page.getByLabel('Data de Nascimento').fill(baby.birthDate)
  await page.getByRole('radio', { name: baby.gender }).click()
  await page.getByRole('button', { name: 'Criar Perfil' }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
}
