import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { buildBaby } from '@/test/fixtures/baby'
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/test-utils'

import { AddMilestoneDialog } from './AddMilestoneDialog'

const babyId = '11111111-1111-4111-8111-111111111111'
const birthDate = '2024-03-10'
const otherBabyId = '33333333-3333-4333-8333-333333333333'

const baby = buildBaby({ id: babyId, name: 'Baby One', birthDate })

const otherBaby = { ...baby, id: otherBabyId, name: 'Baby Two' }

// A single-baby household auto-selects and skips the picker step, so most
// tests here can exercise the wizard exactly as if babyId/birthDate were still props.
beforeEach(() => {
  server.use(http.get(`${config.apiBaseUrl}/babies`, () => HttpResponse.json([baby])))
})

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
    renderWithProviders(<AddMilestoneDialog open onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(postCallCount).toBe(0)
  })

  it('blocks advancing to the details step without the required fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddMilestoneDialog open onOpenChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => {
      expect(screen.getAllByText('Valor muito curto.').length).toBeGreaterThan(0)
    })
    expect(screen.queryByLabelText('Detalhes')).not.toBeInTheDocument()
  })

  it('lets the user go back to the first step without losing what was typed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddMilestoneDialog open onOpenChange={vi.fn()} />)

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
    renderWithProviders(<AddMilestoneDialog open onOpenChange={onOpenChange} />)

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

  it('shows a baby picker first when the household has more than one child, and gates progress on a choice', async () => {
    server.use(http.get(`${config.apiBaseUrl}/babies`, () => HttpResponse.json([baby, otherBaby])))

    const user = userEvent.setup()
    renderWithProviders(<AddMilestoneDialog open onOpenChange={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Baby One')).toBeInTheDocument()
    })
    expect(screen.getByText('Baby Two')).toBeInTheDocument()
    expect(screen.queryByLabelText('O que aconteceu?')).not.toBeInTheDocument()

    const continueButton = screen.getByRole('button', { name: 'Continuar' })
    expect(continueButton).toBeDisabled()

    await user.click(screen.getByText('Baby Two'))
    expect(continueButton).toBeEnabled()

    await user.click(continueButton)
    expect(screen.getByLabelText('O que aconteceu?')).toBeInTheDocument()
  })
  it('opens already filled when a suggestion is given, and keeps it editable', async () => {
    renderWithProviders(
      <AddMilestoneDialog open onOpenChange={vi.fn()} suggestion={{ title: 'Primeira palavra', category: 'LANGUAGE' }} />,
    )

    await waitFor(() => {
      expect(screen.getByLabelText('O que aconteceu?')).toHaveValue('Primeira palavra')
    })

    // The category comes selected with it: a suggestion that filled only the
    // title would still leave the person choosing where it belongs, which is
    // the part of the form that is not obvious.
    const linguagem = screen.getAllByRole('radio').find((radio) => radio.getAttribute('value') === 'LANGUAGE')
    expect(linguagem).toHaveAttribute('aria-checked', 'true')

    // A starting point, not a template.
    const user = userEvent.setup()
    await user.clear(screen.getByLabelText('O que aconteceu?'))
    await user.type(screen.getByLabelText('O que aconteceu?'), 'Falou mamãe')
    expect(screen.getByLabelText('O que aconteceu?')).toHaveValue('Falou mamãe')
  })

  it('opens blank when no suggestion is given', async () => {
    renderWithProviders(<AddMilestoneDialog open onOpenChange={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByLabelText('O que aconteceu?')).toHaveValue('')
    })
    expect(screen.getAllByRole('radio').every((radio) => radio.getAttribute('aria-checked') === 'false')).toBe(true)
  })

})
