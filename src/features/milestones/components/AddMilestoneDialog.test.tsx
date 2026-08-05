import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/test-utils'

import { AddMilestoneDialog } from './AddMilestoneDialog'

const babyId = '11111111-1111-4111-8111-111111111111'
const birthDate = '2024-03-10'

describe('AddMilestoneDialog', () => {
  it('closes without calling the API when the close button is clicked', async () => {
    let postCallCount = 0
    server.use(
      http.post(`${config.apiBaseUrl}/babies/:babyId/milestones`, () => {
        postCallCount += 1
        return HttpResponse.json(null, { status: 201 })
      }),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderWithProviders(<AddMilestoneDialog babyId={babyId} birthDate={birthDate} open onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(postCallCount).toBe(0)
  })

  it('blocks advancing to the details step without the required fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddMilestoneDialog babyId={babyId} birthDate={birthDate} open onOpenChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => {
      expect(screen.getAllByText('Valor muito curto.').length).toBeGreaterThan(0)
    })
    expect(screen.queryByLabelText('Detalhes')).not.toBeInTheDocument()
  })

  it('lets the user go back to the first step without losing what was typed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddMilestoneDialog babyId={babyId} birthDate={birthDate} open onOpenChange={vi.fn()} />)

    await user.type(screen.getByLabelText('O que aconteceu?'), 'Primeiros passos')
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2024-06-01' } })
    await user.click(screen.getAllByRole('radio', { name: /Motor/ })[0]!)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Detalhes')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(screen.getByLabelText('O que aconteceu?')).toHaveValue('Primeiros passos')
  })

  it('creates the milestone across both steps and closes the dialog', async () => {
    let postCallCount = 0
    server.use(
      http.post(`${config.apiBaseUrl}/babies/:babyId/milestones`, async () => {
        postCallCount += 1
        return HttpResponse.json(
          {
            id: '22222222-2222-4222-8222-222222222222',
            babyId,
            title: 'Primeiros passos',
            description: null,
            achievedAt: '2024-06-01',
            category: 'MOTOR',
            photoUrl: null,
            createdAt: '2024-06-01T00:00:00.000Z',
          },
          { status: 201 },
        )
      }),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderWithProviders(<AddMilestoneDialog babyId={babyId} birthDate={birthDate} open onOpenChange={onOpenChange} />)

    await user.type(screen.getByLabelText('O que aconteceu?'), 'Primeiros passos')
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2024-06-01' } })
    await user.click(screen.getAllByRole('radio', { name: /Motor/ })[0]!)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Salvar Marco' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'Salvar Marco' }))

    await waitFor(() => {
      expect(postCallCount).toBe(1)
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
