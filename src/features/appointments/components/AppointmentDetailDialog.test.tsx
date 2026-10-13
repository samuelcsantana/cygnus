import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { buildAppointment } from '@/test/fixtures/appointment'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor, within } from '@/test/test-utils'

import { AppointmentDetailDialog } from './AppointmentDetailDialog'

const babyId = '22222222-2222-4222-8222-222222222222'

const sampleAppointment = buildAppointment({
  babyId,
  location: 'Clínica Central',
  reason: 'Checkup',
  createdAt: '2026-01-10T00:00:00.000Z',
})

describe('AppointmentDetailDialog', () => {
  it('does not cancel the appointment on the first click — asks for confirmation first', async () => {
    let patchCallCount = 0
    server.use(
      http.patch(`${config.apiBaseUrl}/babies/:babyId/appointments/:appointmentId`, () => {
        patchCallCount += 1
        return HttpResponse.json({ ...sampleAppointment, status: 'CANCELLED' })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(
      <AppointmentDetailDialog appointment={sampleAppointment} onOpenChange={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar Consulta' }))

    expect(patchCallCount).toBe(0)
    expect(screen.getByText('Cancelar esta consulta?')).toBeInTheDocument()
  })

  it('only cancels the appointment after the confirmation is accepted', async () => {
    let patchCallCount = 0
    server.use(
      http.patch(`${config.apiBaseUrl}/babies/:babyId/appointments/:appointmentId`, () => {
        patchCallCount += 1
        return HttpResponse.json({ ...sampleAppointment, status: 'CANCELLED' })
      }),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderWithProviders(
      <AppointmentDetailDialog appointment={sampleAppointment} onOpenChange={onOpenChange} />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar Consulta' }))

    const confirmDialog = screen.getByRole('alertdialog')
    await user.click(within(confirmDialog).getByRole('button', { name: 'Sim, cancelar consulta' }))

    await waitFor(() => {
      expect(patchCallCount).toBe(1)
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('leaves the appointment untouched when the confirmation is dismissed', async () => {
    let patchCallCount = 0
    server.use(
      http.patch(`${config.apiBaseUrl}/babies/:babyId/appointments/:appointmentId`, () => {
        patchCallCount += 1
        return HttpResponse.json({ ...sampleAppointment, status: 'CANCELLED' })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(
      <AppointmentDetailDialog appointment={sampleAppointment} onOpenChange={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar Consulta' }))
    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(patchCallCount).toBe(0)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
  it('deletes the appointment and closes, for any status', async () => {
    let deleted: string | null = null
    server.use(
      http.delete(
        `${config.apiBaseUrl}/babies/:babyId/appointments/:appointmentId`,
        ({ params }) => {
          deleted = params.appointmentId as string
          return new HttpResponse(null, { status: 204 })
        },
      ),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    // COMPLETED on purpose: cancelling only makes sense for a scheduled visit,
    // and a typo in one that already happened had no way out before this.
    renderWithProviders(
      <AppointmentDetailDialog
        appointment={{ ...sampleAppointment, status: 'COMPLETED' }}
        onOpenChange={onOpenChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Excluir consulta' }))
    await user.click(await screen.findByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(deleted).toBe(sampleAppointment.id)
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('keeps the dialog open and says so when the delete fails', async () => {
    server.use(
      http.delete(`${config.apiBaseUrl}/babies/:babyId/appointments/:appointmentId`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderWithProviders(
      <AppointmentDetailDialog appointment={sampleAppointment} onOpenChange={onOpenChange} />,
    )

    await user.click(screen.getByRole('button', { name: 'Excluir consulta' }))
    await user.click(await screen.findByRole('button', { name: 'Excluir' }))

    // Closing on a failure would look exactly like success and leave the row
    // on screen with no explanation.
    await waitFor(() => {
      expect(onOpenChange).not.toHaveBeenCalledWith(false)
    })
  })
})

it('does not offer measurements for a cancelled appointment and shows its context', () => {
  renderWithProviders(
    <AppointmentDetailDialog
      appointment={{ ...sampleAppointment, status: 'CANCELLED' }}
      onOpenChange={vi.fn()}
    />,
  )
  expect(screen.queryByLabelText(/Peso/)).not.toBeInTheDocument()
  expect(screen.queryByLabelText(/Altura/)).not.toBeInTheDocument()
  expect(screen.getByText('Clínica Central')).toBeVisible()
  expect(screen.getByText('Checkup')).toBeVisible()
})

describe('saving what happened at a visit', () => {
  const patchUrl = `${config.apiBaseUrl}/babies/:babyId/appointments/:appointmentId`

  afterEach(() => vi.restoreAllMocks())

  function capturePatch() {
    const bodies: Record<string, unknown>[] = []
    server.use(
      http.patch(patchUrl, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        bodies.push(body)
        return HttpResponse.json({ ...sampleAppointment, status: 'COMPLETED', ...body })
      }),
    )
    return bodies
  }

  // The form speaks kilograms and centimetres with a decimal comma; the API stores grams and
  // millimetres as integers, the raw material of a growth curve.
  it('saves the notes and the measurements of a visit that happened, in grams and millimetres', async () => {
    const bodies = capturePatch()
    const success = vi.spyOn(toast, 'success')
    const user = userEvent.setup()
    renderWithProviders(<AppointmentDetailDialog appointment={{ ...sampleAppointment, status: 'COMPLETED' }} onOpenChange={vi.fn()} />)

    await user.type(screen.getByLabelText('Anotações'), 'Tudo bem, volta em 2 meses')
    await user.type(screen.getByLabelText('Peso (kg)'), '7,3')
    await user.type(screen.getByLabelText('Altura (cm)'), '65,7')
    await user.click(screen.getByRole('button', { name: 'Salvar Anotações' }))

    await waitFor(() => expect(success).toHaveBeenCalledWith('Anotações salvas.'))
    expect(bodies).toEqual([{ notes: 'Tudo bem, volta em 2 meses', weightGrams: 7300, heightMillimeters: 657 }])
  })

  // Emptying a field is a correction and goes as null; leaving it out would mean "unchanged".
  it('sends null for a measurement that was cleared', async () => {
    const bodies = capturePatch()
    const user = userEvent.setup()
    renderWithProviders(
      <AppointmentDetailDialog
        appointment={{ ...sampleAppointment, status: 'COMPLETED', weightGrams: 7300, heightMillimeters: 657 }}
        onOpenChange={vi.fn()}
      />,
    )

    await user.clear(screen.getByLabelText('Peso (kg)'))
    await user.click(screen.getByRole('button', { name: 'Salvar Anotações' }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({ weightGrams: null, heightMillimeters: 657 })
  })

  it('refuses a weight outside 0.1 to 150 kg without sending anything', async () => {
    const bodies = capturePatch()
    const user = userEvent.setup()
    renderWithProviders(<AppointmentDetailDialog appointment={{ ...sampleAppointment, status: 'COMPLETED' }} onOpenChange={vi.fn()} />)

    await user.type(screen.getByLabelText('Peso (kg)'), '200')
    await user.click(screen.getByRole('button', { name: 'Salvar Anotações' }))

    expect(screen.getByText('Informe um peso entre 0,1 e 150 kg.')).toBeInTheDocument()
    expect(screen.getByLabelText('Peso (kg)')).toHaveAttribute('aria-invalid', 'true')
    expect(bodies).toEqual([])
  })

  it('marks a scheduled visit as completed, keeps the notes typed, and closes', async () => {
    const bodies = capturePatch()
    const success = vi.spyOn(toast, 'success')
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<AppointmentDetailDialog appointment={sampleAppointment} onOpenChange={onOpenChange} />)

    await user.type(screen.getByLabelText('Anotações'), 'Vacinas em dia')
    await user.click(screen.getByRole('button', { name: 'Marcar como Concluída' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(bodies).toEqual([{ status: 'COMPLETED', notes: 'Vacinas em dia' }])
    expect(success).toHaveBeenCalledWith('Consulta marcada como concluída.')
  })
})
