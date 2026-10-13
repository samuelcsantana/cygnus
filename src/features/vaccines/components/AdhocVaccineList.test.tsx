import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { buildBaby } from '@/test/fixtures/baby'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor, within } from '@/test/test-utils'

import type { AdhocVaccineRecord } from '../api/vaccines.schemas'
import { AdhocVaccineList } from './AdhocVaccineList'

const ana = buildBaby({ id: '11111111-1111-4111-8111-111111111111', name: 'Ana' })
const bruno = buildBaby({ id: '22222222-2222-4222-8222-222222222222', name: 'Bruno' })

function record(overrides: Partial<AdhocVaccineRecord>): AdhocVaccineRecord {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    babyId: ana.id,
    source: 'CAMPAIGN',
    customName: 'Influenza',
    customDose: null,
    status: 'APPLIED',
    applicationDate: '2026-05-04',
    notes: null,
    batchNumber: null,
    location: null,
    professional: null,
    photoUrl: null,
    ...overrides,
  }
}

const adhocUrl = (babyId: string) => `${config.apiBaseUrl}/babies/${babyId}/vaccines/adhoc`

// The list asks for the family itself and keeps the children it was given.
const family = () => http.get(`${config.apiBaseUrl}/babies`, () => HttpResponse.json([ana, bruno]))

describe('AdhocVaccineList', () => {
  afterEach(() => vi.restoreAllMocks())

  it("lists every child's campaign and custom vaccines, saying whose each one is", async () => {
    server.use(
      family(),
      http.get(adhocUrl(ana.id), () => HttpResponse.json([record({ customDose: 'Dose única' })])),
      http.get(adhocUrl(bruno.id), () =>
        HttpResponse.json([record({ id: '44444444-4444-4444-8444-444444444444', babyId: bruno.id, source: 'CUSTOM', customName: 'Febre amarela (viagem)' })]),
      ),
    )

    renderWithProviders(<AdhocVaccineList babies={[ana, bruno]} />)

    const rows = await screen.findAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(within(rows[0]!).getByText('Influenza')).toBeInTheDocument()
    expect(within(rows[0]!).getByText(/Ana · Dose única · 04\/05\/2026/)).toBeInTheDocument()
    expect(within(rows[0]!).getByText('Campanha')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('Outra vacina')).toBeInTheDocument()
  })

  it('says there is nothing to show when no child has one', async () => {
    server.use(family(), http.get(adhocUrl(ana.id), () => HttpResponse.json([])))

    renderWithProviders(<AdhocVaccineList babies={[ana]} />)

    expect(await screen.findByText('Nenhuma vacina de campanha ou personalizada registrada.')).toBeInTheDocument()
  })

  it('offers to try again when the records cannot be loaded, and loads them on retry', async () => {
    let fail = true
    server.use(
      family(),
      http.get(adhocUrl(ana.id), () => (fail ? HttpResponse.json({ status: 'error' }, { status: 500 }) : HttpResponse.json([record({})]))),
    )
    const user = userEvent.setup()
    renderWithProviders(<AdhocVaccineList babies={[ana]} />)

    const alert = await screen.findByRole('alert')
    fail = false
    await user.click(within(alert).getByRole('button'))

    expect(await screen.findByText('Influenza')).toBeInTheDocument()
  })

  it('deletes a record after confirmation, and drops it from the list', async () => {
    const success = vi.spyOn(toast, 'success')
    server.use(
      family(),
      http.get(adhocUrl(ana.id), () => HttpResponse.json([record({})])),
      http.delete(`${adhocUrl(ana.id)}/:recordId`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    renderWithProviders(<AdhocVaccineList babies={[ana]} />)

    await user.click(await screen.findByRole('button', { name: 'Excluir registro de Influenza' }))
    await user.click(await screen.findByRole('button', { name: 'Excluir' }))

    await waitFor(() => expect(success).toHaveBeenCalledWith('Registro excluído com sucesso.'))
    expect(screen.queryByText('Influenza')).not.toBeInTheDocument()
  })

  // Radix closes the confirmation as soon as it is pressed, so a failure cannot be shown inside it.
  it('reports a failed deletion in a toast and keeps the record', async () => {
    const error = vi.spyOn(toast, 'error')
    server.use(
      family(),
      http.get(adhocUrl(ana.id), () => HttpResponse.json([record({})])),
      http.delete(`${adhocUrl(ana.id)}/:recordId`, () => HttpResponse.json({ status: 'error' }, { status: 500 })),
    )
    const user = userEvent.setup()
    renderWithProviders(<AdhocVaccineList babies={[ana]} />)

    await user.click(await screen.findByRole('button', { name: 'Excluir registro de Influenza' }))
    await user.click(await screen.findByRole('button', { name: 'Excluir' }))

    await waitFor(() => expect(error).toHaveBeenCalledWith('Não foi possível excluir o registro. Tente novamente.'))
    expect(screen.getByText('Influenza')).toBeInTheDocument()
  })
})
