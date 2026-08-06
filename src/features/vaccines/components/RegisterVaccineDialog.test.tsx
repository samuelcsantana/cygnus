import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'

import type { VaccineItem } from '../api/vaccines.schemas'
import { RegisterVaccineDialog } from './RegisterVaccineDialog'

const pendingItem: VaccineItem = {
  vaccineId: '11111111-1111-4111-8111-111111111111',
  name: 'Hepatite B',
  description: 'Protects against hepatitis B.',
  doseNumber: 1,
  recommendedAgeInMonths: 0,
  status: 'PENDING',
  applicationDate: null,
  notes: null,
  batchNumber: null,
  location: null,
  professional: null,
  photoUrl: null,
}

const sampleBabyId = '22222222-2222-4222-8222-222222222222'
const otherBabyId = '55555555-5555-4555-8555-555555555555'

const baby = {
  id: sampleBabyId,
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
// tests here can exercise the wizard exactly as if babyId/pendingItems were still props.
beforeEach(() => {
  server.use(
    http.get(`${config.apiBaseUrl}/babies`, () => HttpResponse.json([baby])),
    http.get(`${config.apiBaseUrl}/babies/:babyId/vaccines`, () =>
      HttpResponse.json([{ ageInMonths: 0, items: [pendingItem] }]),
    ),
  )
})

function renderDialog(onOpenChange = vi.fn()) {
  return renderWithProviders(<RegisterVaccineDialog open onOpenChange={onOpenChange} />)
}

describe('RegisterVaccineDialog', () => {
  it('advances to the selection step as soon as a type is chosen', async () => {
    const user = userEvent.setup()
    renderDialog()

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Continuar' })).not.toBeInTheDocument()
    })

    await user.click(screen.getByText('Calendário obrigatório'))

    await waitFor(() => {
      expect(screen.getByText('Hepatite B')).toBeInTheDocument()
    })
    expect(screen.queryByText('Campanha de vacinação')).not.toBeInTheDocument()
  })

  it('disables "Continuar" on the selection step until a vaccine is chosen', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByText('Calendário obrigatório'))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
    })

    await user.click(screen.getByText('Hepatite B'))
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled()
  })

  it('lets the user go back from the selection step to the type step', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByText('Calendário obrigatório'))
    await waitFor(() => {
      expect(screen.getByText('Hepatite B')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(screen.getByText('Campanha de vacinação')).toBeInTheDocument()
    expect(screen.queryByText('Hepatite B')).not.toBeInTheDocument()
  })

  it('applies a catalog vaccine via PATCH .../apply with the selected vaccineId', async () => {
    let capturedUrl = ''
    server.use(
      http.patch(`${config.apiBaseUrl}/babies/:babyId/vaccines/:vaccineId/apply`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ ...pendingItem, status: 'APPLIED', applicationDate: '2026-01-01' })
      }),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderDialog(onOpenChange)

    await user.click(screen.getByText('Calendário obrigatório'))
    await waitFor(() => {
      expect(screen.getByText('Hepatite B')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Hepatite B'))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Salvar vacina' }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    expect(capturedUrl).toContain(`/vaccines/${pendingItem.vaccineId}/apply`)
  })

  it('registers a campaign vaccine via POST .../adhoc with source CAMPAIGN', async () => {
    let receivedBody: unknown = null
    server.use(
      http.post(`${config.apiBaseUrl}/babies/:babyId/vaccines/adhoc`, async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json(
          {
            id: '33333333-3333-4333-8333-333333333333',
            babyId: sampleBabyId,
            source: 'CAMPAIGN',
            customName: 'Influenza (gripe) — Campanha anual',
            customDose: null,
            status: 'APPLIED',
            applicationDate: '2026-01-01',
            notes: null,
            batchNumber: null,
            location: null,
            professional: null,
            photoUrl: null,
          },
          { status: 201 },
        )
      }),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderDialog(onOpenChange)

    await user.click(screen.getByText('Campanha de vacinação'))
    await user.click(screen.getByText('Influenza (gripe) — Campanha anual'))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Salvar vacina' }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    expect(receivedBody).toMatchObject({ source: 'CAMPAIGN', customName: 'Influenza (gripe) — Campanha anual' })
  })

  it('registers a custom vaccine via POST .../adhoc with source CUSTOM', async () => {
    let receivedBody: unknown = null
    server.use(
      http.post(`${config.apiBaseUrl}/babies/:babyId/vaccines/adhoc`, async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json(
          {
            id: '44444444-4444-4444-8444-444444444444',
            babyId: sampleBabyId,
            source: 'CUSTOM',
            customName: 'Varicela combinada (MMRV)',
            customDose: '1ª dose',
            status: 'APPLIED',
            applicationDate: '2026-01-01',
            notes: null,
            batchNumber: null,
            location: null,
            professional: null,
            photoUrl: null,
          },
          { status: 201 },
        )
      }),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderDialog(onOpenChange)

    await user.click(screen.getByText('Outra vacina'))
    await user.type(screen.getByLabelText('Nome da vacina'), 'Varicela combinada (MMRV)')
    await user.type(screen.getByLabelText('Dose (Opcional)'), '1ª dose')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Salvar vacina' }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    expect(receivedBody).toMatchObject({ source: 'CUSTOM', customName: 'Varicela combinada (MMRV)', customDose: '1ª dose' })
  })

  it('shows an inline error and keeps the dialog open when the mutation fails', async () => {
    server.use(
      http.post(`${config.apiBaseUrl}/babies/:babyId/vaccines/adhoc`, () =>
        HttpResponse.json({ status: 'error', message: 'Bad request' }, { status: 400 }),
      ),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderDialog(onOpenChange)

    await user.click(screen.getByText('Outra vacina'))
    await user.type(screen.getByLabelText('Nome da vacina'), 'Varicela')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Salvar vacina' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível registrar a vacina. Tente novamente.')
    })
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('shows a baby picker first when the household has more than one child, and gates progress on a choice', async () => {
    server.use(http.get(`${config.apiBaseUrl}/babies`, () => HttpResponse.json([baby, otherBaby])))

    const user = userEvent.setup()
    renderDialog()

    await waitFor(() => {
      expect(screen.getByText('Baby One')).toBeInTheDocument()
    })
    expect(screen.getByText('Baby Two')).toBeInTheDocument()

    const continueButton = screen.getByRole('button', { name: 'Continuar' })
    expect(continueButton).toBeDisabled()

    await user.click(screen.getByText('Baby Two'))
    expect(continueButton).toBeEnabled()

    await user.click(continueButton)
    expect(screen.getByText('Calendário obrigatório')).toBeInTheDocument()
  })
})
