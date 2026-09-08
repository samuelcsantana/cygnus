import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

// Deterministic alerts exercise the production UI without depending on the daily reminder job.
test('notification filters, read state and record navigation work on mobile and desktop', async ({ page }) => {
  const ana = { id: '11111111-1111-4111-8111-111111111111', userId: '99999999-9999-4999-8999-999999999999', name: 'Ana', birthDate: '2024-01-01', sexAtBirth: 'FEMALE', bloodType: null, allergies: [], healthPlanName: null, healthPlanNumber: null, avatarUrl: null, avatarColor: null, measurements: [], createdAt: '2026-01-01T12:00:00Z' }
  const bruno = { ...ana, id: '22222222-2222-4222-8222-222222222222', name: 'Bruno' }
  const appointment = { id: ana.id, babyId: ana.id, doctorName: 'Dra. Helena', scheduledAt: '2099-09-10T15:00:00Z', specialty: 'Pediatria', location: null, reason: null, notes: null, status: 'SCHEDULED', weightGrams: null, heightMillimeters: null, createdAt: ana.createdAt }
  let items = [
    { id: '33333333-3333-4333-8333-333333333333', babyId: ana.id, type: 'APPOINTMENT_UPCOMING', referenceId: appointment.id, title: 'Consulta da Ana', message: 'Ana tem consulta em 2099-09-10T15:00:00.000Z.', readAt: null as string | null, createdAt: '2026-09-08T12:00:00Z' },
    { id: '44444444-4444-4444-8444-444444444444', babyId: bruno.id, type: 'VACCINE_DELAYED', referenceId: '55555555-5555-4555-8555-555555555555', title: 'Vacina do Bruno', message: 'A vacina de Bruno está atrasada.', readAt: null as string | null, createdAt: '2026-09-08T12:00:00Z' },
  ]
  await page.route('**/auth/me', route => route.fulfill({ json: { id: ana.userId, name: 'Responsável', email: 'parent@example.com', createdAt: ana.createdAt } }))
  await page.route('**/babies', route => route.fulfill({ json: [ana, bruno] }))
  await page.route('**/babies/*/appointments', route => route.fulfill({ json: [appointment] }))
  await page.route('**/notifications', route => route.request().isNavigationRequest() ? route.continue() : route.fulfill({ json: items }))
  await page.route('**/notifications/*/read', route => {
    const id = route.request().url().split('/').at(-2)
    items = items.map(item => item.id === id ? { ...item, readAt: '2026-09-08T13:00:00Z' } : item)
    return route.fulfill({ json: items.find(item => item.id === id) })
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/notifications')
  await expect(page.getByRole('heading', { name: 'Consulta da Ana' })).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.setViewportSize({ width: 375, height: 812 })
  await page.screenshot({ path: 'docs/verification/notifications-mobile.png', fullPage: true })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  expect(await page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')).toBe(true)
  await page.getByRole('combobox', { name: 'Criança', exact: true }).click()
  await expect(page.getByRole('listbox')).toBeVisible()
  // Radix hides the background while the popup owns focus. Audit the active
  // listbox here; the complete page is audited above with the popup closed.
  expect((await new AxeBuilder({ page }).include('[role="listbox"]').analyze()).violations).toEqual([])
  await page.screenshot({ path: 'docs/verification/notifications-select-mobile.png', fullPage: true })
  await page.getByRole('option', { name: 'Ana', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Vacina do Bruno' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Marcar como lida', exact: true }).click()
  await expect(page.getByRole('link', { name: /Notificações, 1 não lida/ })).toBeVisible()
  await page.getByRole('button', { name: 'Ver consulta' }).click()
  await expect(page).toHaveURL(/\/appointments$/)
  await expect(page.getByText('Registro relacionado a “Consulta da Ana”')).toBeVisible()
  await expect(page.getByText('Dra. Helena', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: /Notificações/ }).click()
  await page.getByLabel('Somente não lidas').check()
  await expect(page.getByText('Nenhuma notificação não lida')).toBeVisible()
  await page.getByRole('combobox', { name: 'Criança', exact: true }).focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('option', { name: 'Ana', exact: true })).toBeFocused()
  await page.keyboard.press('Home')
  await expect(page.getByRole('option', { name: 'Todas as crianças' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Vacina do Bruno' })).toBeVisible()
})
