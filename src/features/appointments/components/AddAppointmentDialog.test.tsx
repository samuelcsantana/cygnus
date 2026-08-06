import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/test-utils'

import { AddAppointmentDialog } from './AddAppointmentDialog'

const babyId = '11111111-1111-4111-8111-111111111111'
const otherBabyId = '33333333-3333-4333-8333-333333333333'

const baby = {
  id: babyId,
  userId: '99999999-9999-4999-8999-999999999999',
  name: 'Baby One',
  birthDate: '2024-01-01',
  gender: 'FEMALE',
  bloodType: null,
  allergies: [],
  avatarUrl: null,
  avatarColor: null,
  createdAt: '2024-01-01T00:00:00.000Z',
}

const otherBaby = { ...baby, id: otherBabyId, name: 'Baby Two' }

// A single-baby household auto-selects and skips the picker step, so most
// tests here can exercise the wizard exactly as if babyId were still a prop.
beforeEach(() => {
  server.use(http.get(`${config.apiBaseUrl}/babies`, () => HttpResponse.json([baby])))
})

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
    renderWithProviders(<AddAppointmentDialog open onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(postCallCount).toBe(0)
  })

  it('blocks advancing to the schedule step without a professional name', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddAppointmentDialog open onOpenChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => {
      expect(screen.getByText('Valor muito curto.')).toBeInTheDocument()
    })
    expect(screen.queryByLabelText('Data')).not.toBeInTheDocument()
  })

  it('lets the user go back to the professional step without losing what was typed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddAppointmentDialog open onOpenChange={vi.fn()} />)

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
    renderWithProviders(<AddAppointmentDialog open onOpenChange={onOpenChange} />)

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

  it('shows a baby picker first when the household has more than one child, and gates progress on a choice', async () => {
    server.use(http.get(`${config.apiBaseUrl}/babies`, () => HttpResponse.json([baby, otherBaby])))

    const user = userEvent.setup()
    renderWithProviders(<AddAppointmentDialog open onOpenChange={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Baby One')).toBeInTheDocument()
    })
    expect(screen.getByText('Baby Two')).toBeInTheDocument()
    expect(screen.queryByLabelText('Nome do Profissional')).not.toBeInTheDocument()

    const continueButton = screen.getByRole('button', { name: 'Continuar' })
    expect(continueButton).toBeDisabled()

    await user.click(screen.getByText('Baby Two'))
    expect(continueButton).toBeEnabled()

    await user.click(continueButton)
    expect(screen.getByLabelText('Nome do Profissional')).toBeInTheDocument()
  })
})
