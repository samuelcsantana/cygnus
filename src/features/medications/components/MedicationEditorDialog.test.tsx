import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, expect, it, vi } from 'vitest'
import { config } from '@/lib/config'
import { buildBaby } from '@/test/fixtures/baby'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'
import { MedicationEditorDialog } from './MedicationEditorDialog'

const baby = buildBaby({ name: 'Alice' })
const record = { id: '55555555-5555-4555-8555-555555555555', babyId: baby.id, name: 'Registro de teste', dosage: 'Conforme receita', frequency: 'Conforme receita', startedOn: '2026-01-10', endedOn: null, reason: null, prescriberName: null, notes: null, createdAt: '2026-01-10T00:00:00Z' }
beforeEach(() => server.use(
  http.get(`${config.apiBaseUrl}/babies`, () => HttpResponse.json([baby])),
  http.get(`${config.apiBaseUrl}/specialists`, () => HttpResponse.json([])),
))

it('validates the name before continuing and saves the selected child and free text', async () => {
  const saved = vi.fn()
  server.use(http.post(`${config.apiBaseUrl}/babies/:babyId/medications`, async ({ request, params }) => {
    saved(params.babyId, await request.json())
    return HttpResponse.json(record)
  }))
  const onOpenChange = vi.fn()
  renderWithProviders(<MedicationEditorDialog onOpenChange={onOpenChange} />)
  const user = userEvent.setup()
  const name = await screen.findByLabelText('Medicamento')
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  expect(name).toHaveAttribute('aria-invalid', 'true')
  await user.type(name, 'Registro de teste')
  await user.type(screen.getByLabelText(/Dose/), 'Conforme receita')
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await user.click(screen.getByRole('button', { name: /Salvar|Registrar medicamento/i }))
  await waitFor(() => expect(saved).toHaveBeenCalledWith(baby.id, expect.objectContaining({ name: 'Registro de teste', dosage: 'Conforme receita' })))
  expect(onOpenChange).toHaveBeenCalledWith(false)
})

it('preserves the draft after a save failure and asks before closing', async () => {
  server.use(http.post(`${config.apiBaseUrl}/babies/:babyId/medications`, () => new HttpResponse(null, { status: 500 })))
  const onOpenChange = vi.fn()
  renderWithProviders(<MedicationEditorDialog onOpenChange={onOpenChange} />)
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Medicamento'), 'Registro de teste')
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await user.click(screen.getByRole('button', { name: /Salvar|Registrar medicamento/i }))
  expect(await screen.findByRole('alert')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Voltar' }))
  expect(screen.getByLabelText('Medicamento')).toHaveValue('Registro de teste')
  await user.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(screen.getByRole('alertdialog')).toBeVisible()
  expect(onOpenChange).not.toHaveBeenCalled()
})

it('clears optional data when editing and keeps the original child', async () => {
  const saved = vi.fn()
  server.use(http.patch(`${config.apiBaseUrl}/babies/:babyId/medications/:id`, async ({ request }) => {
    saved(await request.json()); return HttpResponse.json(record)
  }))
  renderWithProviders(<MedicationEditorDialog medication={record} onOpenChange={vi.fn()} />)
  const user = userEvent.setup()
  await user.clear(await screen.findByLabelText(/Dose/))
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await user.click(screen.getByRole('button', { name: /Salvar/i }))
  await waitFor(() => expect(saved).toHaveBeenCalledWith(expect.objectContaining({ dosage: null, endedOn: null })))
})

it('keeps deletion confirmation open after an error so it can be retried', async () => {
  const onOpenChange = vi.fn()
  let calls = 0
  server.use(http.delete(`${config.apiBaseUrl}/babies/:babyId/medications/:id`, () => {
    calls++; return new HttpResponse(null, { status: calls === 1 ? 500 : 204 })
  }))
  renderWithProviders(<MedicationEditorDialog medication={record} onOpenChange={onOpenChange} />)
  const user = userEvent.setup()
  await screen.findByLabelText('Medicamento')
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await user.click(screen.getByRole('button', { name: /Excluir|Remover/i }))
  const { within } = await import('@testing-library/react')
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: /Excluir|Remover/i }))
  expect(await screen.findByRole('alert')).toBeVisible()
  expect(onOpenChange).not.toHaveBeenCalled()
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: /Excluir|Remover/i }))
  await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
})
