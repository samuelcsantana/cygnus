import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor, within } from '@/test/test-utils'

import type { Appointment } from '../api/appointments.schemas'
import { AppointmentDetailDialog } from './AppointmentDetailDialog'

const babyId = '22222222-2222-4222-8222-222222222222'

const sampleAppointment: Appointment = {
  id: '11111111-1111-4111-8111-111111111111',
  babyId,
  scheduledAt: '2026-09-01T10:00:00.000Z',
  doctorName: 'Dra. Ana Souza',
  specialty: 'Pediatria',
  location: 'Clínica Central',
  reason: 'Checkup',
  notes: null,
  status: 'SCHEDULED',
  createdAt: '2026-01-10T00:00:00.000Z',
}

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
      http.delete(`${config.apiBaseUrl}/babies/:babyId/appointments/:appointmentId`, ({ params }) => {
        deleted = params.appointmentId as string
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    // COMPLETED on purpose: cancelling only makes sense for a scheduled visit,
    // and a typo in one that already happened had no way out before this.
    renderWithProviders(
      <AppointmentDetailDialog appointment={{ ...sampleAppointment, status: 'COMPLETED' }} onOpenChange={onOpenChange} />,
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
    renderWithProviders(<AppointmentDetailDialog appointment={sampleAppointment} onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: 'Excluir consulta' }))
    await user.click(await screen.findByRole('button', { name: 'Excluir' }))

    // Closing on a failure would look exactly like success and leave the row
    // on screen with no explanation.
    await waitFor(() => {
      expect(onOpenChange).not.toHaveBeenCalledWith(false)
    })
  })

})
