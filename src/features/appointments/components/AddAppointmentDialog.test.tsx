import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/test-utils'

import { AddAppointmentDialog } from './AddAppointmentDialog'

const babyId = '11111111-1111-4111-8111-111111111111'

describe('AddAppointmentDialog', () => {
  it('closes without calling the API when the close button is clicked', async () => {
    let postCallCount = 0
    server.use(
      http.post(`${config.apiBaseUrl}/babies/:babyId/appointments`, () => {
        postCallCount += 1
        return HttpResponse.json(null, { status: 201 })
      }),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderWithProviders(<AddAppointmentDialog babyId={babyId} open onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(postCallCount).toBe(0)
  })

  it('blocks advancing to the schedule step without a professional name', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddAppointmentDialog babyId={babyId} open onOpenChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => {
      expect(screen.getByText('Valor muito curto.')).toBeInTheDocument()
    })
    expect(screen.queryByLabelText('Data')).not.toBeInTheDocument()
  })

  it('lets the user go back to the professional step without losing what was typed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddAppointmentDialog babyId={babyId} open onOpenChange={vi.fn()} />)

    await user.type(screen.getByLabelText('Nome do Profissional'), 'Dra. Ana Silva')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Data')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(screen.getByLabelText('Nome do Profissional')).toHaveValue('Dra. Ana Silva')
  })

  it('creates the appointment (with specialty) across both steps and closes the dialog', async () => {
    let postCallCount = 0
    let receivedBody: Record<string, unknown> = {}
    server.use(
      http.post(`${config.apiBaseUrl}/babies/:babyId/appointments`, async ({ request }) => {
        postCallCount += 1
        receivedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
          {
            id: '22222222-2222-4222-8222-222222222222',
            babyId,
            scheduledAt: '2030-01-01T10:00:00.000Z',
            doctorName: 'Dra. Ana Silva',
            specialty: 'Pediatria',
            location: null,
            reason: null,
            notes: null,
            status: 'SCHEDULED',
            createdAt: '2024-03-10T00:00:00.000Z',
          },
          { status: 201 },
        )
      }),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderWithProviders(<AddAppointmentDialog babyId={babyId} open onOpenChange={onOpenChange} />)

    await user.type(screen.getByLabelText('Nome do Profissional'), 'Dra. Ana Silva')
    await user.type(screen.getByLabelText('Especialidade (Opcional)'), 'Pediatria')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10)
    await waitFor(() => {
      expect(screen.getByLabelText('Data')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: futureDate } })
    fireEvent.change(screen.getByLabelText('Horário'), { target: { value: '10:00' } })
    await user.click(screen.getByRole('button', { name: 'Salvar Consulta' }))

    await waitFor(() => {
      expect(postCallCount).toBe(1)
    })
    expect(receivedBody.specialty).toBe('Pediatria')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
