import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { buildAppointment } from '@/test/fixtures/appointment'
import { server } from '@/test/msw/server'
import { buildBaby } from '@/test/fixtures/baby'
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/test-utils'

import { AddAppointmentDialog } from './AddAppointmentDialog'

const babyId = '11111111-1111-4111-8111-111111111111'
const otherBabyId = '33333333-3333-4333-8333-333333333333'

const baby = buildBaby({ id: babyId, name: 'Baby One' })

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
          buildAppointment({
            babyId,
            scheduledAt: '2030-01-01T10:00:00.000Z',
            doctorName: 'Dra. Ana Silva',
            specialty: 'Pediatria',
          }),
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
  it('records a consultation that already happened, and says so to the API', async () => {
    let receivedBody: Record<string, unknown> = {}
    server.use(
      http.post(`${config.apiBaseUrl}/babies/:babyId/appointments`, async ({ request }) => {
        receivedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
          buildAppointment({
            babyId,
            scheduledAt: '2024-03-01T10:00:00.000Z',
            doctorName: 'Dra. Ana Silva',
            specialty: null,
            status: 'COMPLETED',
          }),
          { status: 201 },
        )
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<AddAppointmentDialog open onOpenChange={vi.fn()} />)

    await user.type(screen.getByLabelText('Nome do Profissional'), 'Dra. Ana Silva')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Data')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('radio', { name: /Registrar consulta que já aconteceu/ }))

    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10)
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: pastDate } })
    fireEvent.change(screen.getByLabelText('Horário'), { target: { value: '10:00' } })

    // Os campos de medida só existem depois de a pessoa dizer que a consulta já aconteceu — a API
    // recusa medida em visita futura, e o formulário não oferece o que o servidor recusa.
    await user.type(screen.getByLabelText('Peso (kg)'), '15,8')
    await user.type(screen.getByLabelText('Altura (cm)'), '100')
    await user.click(screen.getByRole('button', { name: 'Salvar Consulta' }))

    await waitFor(() => {
      expect(receivedBody.status).toBe('COMPLETED')
    })
    // Vírgula digitada, gramas e milímetros enviados: a conversão acontece uma vez, na borda.
    expect(receivedBody.weightGrams).toBe(15800)
    expect(receivedBody.heightMillimeters).toBe(1000)
  })

  it('não oferece peso e altura enquanto a consulta é um agendamento', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddAppointmentDialog open onOpenChange={vi.fn()} />)

    await user.type(screen.getByLabelText('Nome do Profissional'), 'Dra. Ana Silva')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Data')).toBeInTheDocument()
    })

    expect(screen.queryByLabelText('Peso (kg)')).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /Registrar consulta que já aconteceu/ }))

    expect(screen.getByLabelText('Peso (kg)')).toBeInTheDocument()
  })

  // The mirror of the above, and the reason both are here: if only one passed,
  // the screen would be back to what it was — one act, one direction.
  it('still refuses a past date when the intent is to book', async () => {
    let postCallCount = 0
    server.use(
      http.post(`${config.apiBaseUrl}/babies/:babyId/appointments`, () => {
        postCallCount += 1
        return HttpResponse.json({}, { status: 201 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<AddAppointmentDialog open onOpenChange={vi.fn()} />)

    await user.type(screen.getByLabelText('Nome do Profissional'), 'Dra. Ana Silva')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Data')).toBeInTheDocument()
    })

    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10)
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: pastDate } })
    fireEvent.change(screen.getByLabelText('Horário'), { target: { value: '10:00' } })
    await user.click(screen.getByRole('button', { name: 'Salvar Consulta' }))

    await waitFor(() => {
      expect(screen.getByText('A data e hora não podem estar no passado.')).toBeInTheDocument()
    })
    expect(postCallCount).toBe(0)
  })

})
