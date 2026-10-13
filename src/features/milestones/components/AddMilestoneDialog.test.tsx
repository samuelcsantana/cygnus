import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { buildBaby } from '@/test/fixtures/baby'
import { fireEvent, renderWithProviders, screen, waitFor, within } from '@/test/test-utils'

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

    await waitFor(async () => {
      expect(screen.getAllByText('Valor muito curto.').length).toBeGreaterThan(0)
    })
    expect(screen.getByLabelText('Como foi esse momento? (opcional)')).not.toBeVisible()
  })

  it('lets the user go back to the first step without losing what was typed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddMilestoneDialog open onOpenChange={vi.fn()} />)

    await user.type(await screen.findByLabelText('O que aconteceu?'), 'Primeiros passos')
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2024-06-01' } })
    await user.click(screen.getAllByRole('radio', { name: /Motor/ })[0]!)

    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(async () => {
      expect(screen.getByLabelText('Como foi esse momento? (opcional)')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(await screen.findByLabelText('O que aconteceu?')).toHaveValue('Primeiros passos')
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

    await user.type(await screen.findByLabelText('O que aconteceu?'), 'Primeiros passos')
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2024-06-01' } })
    await user.click(screen.getAllByRole('radio', { name: /Motor/ })[0]!)

    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(async () => {
      expect(screen.getByRole('button', { name: 'Guardar lembrança' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'Guardar lembrança' }))

    await waitFor(async () => {
      expect(postCallCount).toBe(1)
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows a baby picker first when the household has more than one child, and gates progress on a choice', async () => {
    server.use(http.get(`${config.apiBaseUrl}/babies`, () => HttpResponse.json([baby, otherBaby])))

    const user = userEvent.setup()
    renderWithProviders(<AddMilestoneDialog open onOpenChange={vi.fn()} />)

    await waitFor(async () => {
      expect(screen.getByText('Baby One')).toBeInTheDocument()
    })
    expect(screen.getByText('Baby Two')).toBeInTheDocument()
    expect(screen.getByLabelText('O que aconteceu?')).not.toBeVisible()

    const continueButton = screen.getByRole('button', { name: 'Continuar' })
    expect(continueButton).toBeDisabled()

    await user.click(screen.getByText('Baby Two'))
    expect(continueButton).toBeEnabled()

    await user.click(continueButton)
    expect(await screen.findByLabelText('O que aconteceu?')).toBeInTheDocument()
  })
  it('opens already filled when a suggestion is given, and keeps it editable', async () => {
    renderWithProviders(
      <AddMilestoneDialog
        open
        onOpenChange={vi.fn()}
        suggestion={{ title: 'Primeira palavra', category: 'LANGUAGE' }}
      />,
    )

    await waitFor(async () => {
      expect(await screen.findByLabelText('O que aconteceu?')).toHaveValue('Primeira palavra')
    })

    // The category comes selected with it: a suggestion that filled only the
    // title would still leave the person choosing where it belongs, which is
    // the part of the form that is not obvious.
    const linguagem = screen
      .getAllByRole('radio')
      .find((radio) => radio.getAttribute('value') === 'LANGUAGE')
    expect(linguagem).toHaveAttribute('aria-checked', 'true')

    // A starting point, not a template.
    const user = userEvent.setup()
    await user.clear(await screen.findByLabelText('O que aconteceu?'))
    await user.type(await screen.findByLabelText('O que aconteceu?'), 'Falou mamãe')
    expect(await screen.findByLabelText('O que aconteceu?')).toHaveValue('Falou mamãe')
  })

  it('opens blank when no suggestion is given', async () => {
    renderWithProviders(<AddMilestoneDialog open onOpenChange={vi.fn()} />)

    await waitFor(async () => {
      expect(await screen.findByLabelText('O que aconteceu?')).toHaveValue('')
    })
    expect(
      screen.getAllByRole('radio').every((radio) => radio.getAttribute('aria-checked') === 'false'),
    ).toBe(true)
  })
})

describe('AddMilestoneDialog suggestions and photo', () => {
  const created = {
    id: '22222222-2222-4222-8222-222222222222',
    babyId,
    title: 'Primeiro sorriso',
    description: null,
    achievedAt: '2024-06-01',
    category: 'SOCIAL',
    photoUrl: 'https://cygnus.example/uploads/smile.png',
    createdAt: '2024-06-01T00:00:00.000Z',
  }

  afterEach(() => vi.restoreAllMocks())

  async function fillCoreAndContinue(user: ReturnType<typeof userEvent.setup>) {
    await user.click(await screen.findByRole('button', { name: 'Primeiro sorriso' }))
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2024-06-01' } })
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByRole('button', { name: 'Guardar lembrança' })
  }

  it('fills an empty title and its category from a suggestion at once', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddMilestoneDialog open onOpenChange={vi.fn()} />)

    await user.click(await screen.findByRole('button', { name: 'Primeira palavra' }))

    expect(screen.getByLabelText('O que aconteceu?')).toHaveValue('Primeira palavra')
    expect(screen.getAllByRole('radio', { name: /Linguagem/ })[0]).toBeChecked()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  // A parent who already wrote their own title should not lose it to a stray tap on an idea.
  it('asks before a suggestion replaces a title already typed, and keeps it on cancel', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddMilestoneDialog open onOpenChange={vi.fn()} />)
    const title = await screen.findByLabelText('O que aconteceu?')

    await user.type(title, 'Riu do cachorro')
    await user.click(screen.getByRole('button', { name: 'Primeiro sorriso' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }))
    expect(title).toHaveValue('Riu do cachorro')

    await user.click(screen.getByRole('button', { name: 'Primeiro sorriso' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Usar ideia' }))
    expect(title).toHaveValue('Primeiro sorriso')
  })

  it('says the photo could not be sent, and saves nothing', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    let posts = 0
    server.use(
      http.post(`${config.apiBaseUrl}/uploads/milestone-photos`, () => HttpResponse.json({ status: 'error' }, { status: 500 })),
      http.post(`${config.apiBaseUrl}/babies/:babyId/milestones`, () => {
        posts += 1
        return HttpResponse.json(created, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    const { container } = renderWithProviders(<AddMilestoneDialog open onOpenChange={vi.fn()} />)

    await fillCoreAndContinue(user)
    fireEvent.change(container.ownerDocument.querySelector('input[type="file"]')!, {
      target: { files: [new File(['photo'], 'smile.png', { type: 'image/png' })] },
    })
    await user.click(screen.getByRole('button', { name: 'Guardar lembrança' }))

    expect(await screen.findByText('Não foi possível enviar a foto. Tente novamente.')).toBeInTheDocument()
    expect(posts).toBe(0)
  })

  // When the photo went up but the milestone did not save, trying again must not upload the same
  // photo a second time: the first upload's address is reused.
  it('reuses a photo already uploaded when saving is retried', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    let uploads = 0
    let posts = 0
    server.use(
      http.post(`${config.apiBaseUrl}/uploads/milestone-photos`, () => {
        uploads += 1
        return HttpResponse.json({ url: created.photoUrl }, { status: 201 })
      }),
      http.post(`${config.apiBaseUrl}/babies/:babyId/milestones`, () => {
        posts += 1
        return posts === 1 ? HttpResponse.json({ status: 'error' }, { status: 500 }) : HttpResponse.json(created, { status: 201 })
      }),
    )
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    const { container } = renderWithProviders(<AddMilestoneDialog open onOpenChange={onOpenChange} />)

    await fillCoreAndContinue(user)
    fireEvent.change(container.ownerDocument.querySelector('input[type="file"]')!, {
      target: { files: [new File(['photo'], 'smile.png', { type: 'image/png' })] },
    })
    await user.click(screen.getByRole('button', { name: 'Guardar lembrança' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar lembrança' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(uploads).toBe(1)
    expect(posts).toBe(2)
  })
})
