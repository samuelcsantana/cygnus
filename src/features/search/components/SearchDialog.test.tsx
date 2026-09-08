import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
import { useSearchDestinationStore } from '@/shared/stores/searchDestination.store'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { config } from '@/lib/config'
import { buildAppointment } from '@/test/fixtures/appointment'
import { buildBaby } from '@/test/fixtures/baby'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen } from '@/test/test-utils'

import { SearchDialog } from './SearchDialog'

const babyId = '11111111-1111-4111-8111-111111111111'
afterEach(() => {
  useSelectedBabyStore.setState({ selectedBabyId: null })
  useSearchDestinationStore.getState().set(null)
})
const APPOINTMENT = '33333333-3333-4333-8333-333333333333'

/**
 * The six domains the dialog reads. MSW is strict — a request with no handler
 * fails the suite — and that strictness is the point here: it is what proves the
 * dialog fetches exactly these and no seventh thing.
 */
function withAccount(appointments: ReturnType<typeof buildAppointment>[] = []) {
  server.use(
    http.get(`${config.apiBaseUrl}/babies/:babyId/vaccines/adhoc`, () => HttpResponse.json([])),
    http.get(`${config.apiBaseUrl}/babies`, () =>
      HttpResponse.json([buildBaby({ id: babyId, name: 'Elis' })]),
    ),
    // The envelope is parsed for real, and `metadata` is not nullable: a stub of
    // `{ metadata: null }` fails the parse, which shows up as an errored query
    // and not as a type error. Two tests were quietly running with the vaccine
    // list dead before the error state made it visible.
    http.get(`${config.apiBaseUrl}/babies/${babyId}/vaccines`, () =>
      HttpResponse.json({
        metadata: {
          version: '2026.1',
          sourceName: 'PNI',
          sourceOrganization: 'Ministério da Saúde',
          sourceUrl: 'https://www.gov.br/saude',
          sourceUpdatedAt: '2026-01-01',
          effectiveFrom: '2026-01-01',
          minimumAgeInMonths: 0,
          maximumAgeInMonths: 228,
        },
        groups: [],
      }),
    ),
    http.get(`${config.apiBaseUrl}/babies/${babyId}/appointments`, () =>
      HttpResponse.json(appointments),
    ),
    http.get(`${config.apiBaseUrl}/babies/${babyId}/medications`, () => HttpResponse.json([])),
    http.get(`${config.apiBaseUrl}/babies/${babyId}/milestones`, () => HttpResponse.json([])),
    http.get(`${config.apiBaseUrl}/specialists`, () => HttpResponse.json([])),
  )
}

function renderDialog() {
  return renderWithProviders(
    <MemoryRouter>
      <SearchDialog open onOpenChange={() => {}} />
    </MemoryRouter>,
  )
}

describe('SearchDialog', () => {
  it('acha pelo que foi escrito na consulta e leva para a tela dela', async () => {
    withAccount([
      buildAppointment({
        id: APPOINTMENT,
        babyId,
        doctorName: 'Dra. Fernanda Lima',
        specialty: 'Fonoaudiologia',
      }),
    ])

    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByRole('searchbox'), 'fonoaudio')

    const result = await screen.findByRole('link', { name: /Fernanda Lima/ })
    expect(result).toHaveAttribute('href', '/appointments')
    // O rótulo do grupo é a palavra do menu, que é onde a pessoa vai cair.
    expect(screen.getByRole('heading', { name: /Consultas/ })).toBeInTheDocument()
  })

  /**
   * Acento é o caso comum, não o exótico: o dado do catálogo tem, e quem digita
   * no celular com pressa não segura a tecla.
   */
  it('acha sem acento o que está escrito com acento', async () => {
    withAccount([buildAppointment({ id: APPOINTMENT, babyId, doctorName: 'Dr. João Sebastião' })])

    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByRole('searchbox'), 'joao')

    expect(await screen.findByRole('link', { name: /João/ })).toBeInTheDocument()
  })

  it('não procura nada com uma letra só', async () => {
    withAccount([buildAppointment({ id: APPOINTMENT, babyId, doctorName: 'Elis' })])

    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByRole('searchbox'), 'e')

    expect(await screen.findByText('Digite ao menos duas letras.')).toBeInTheDocument()
  })

  /**
   * Uma casa com três filhos casa a mesma palavra em cem doses do calendário. A
   * lista defere para a seção em vez de renderizar tudo.
   */
  it('corta a seção em cinco e manda o resto para a tela da seção', async () => {
    withAccount(
      Array.from({ length: 11 }, (_, index) =>
        buildAppointment({
          id: `${String(index).padStart(8, '0')}-3333-4333-8333-333333333333`,
          babyId,
          doctorName: `Dra. Fernanda ${index}`,
          specialty: 'Fonoaudiologia',
        }),
      ),
    )

    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByRole('searchbox'), 'fernanda')

    // Sem nomear um resultado específico: as onze consultas compartilham a data,
    // então quais oito sobrevivem à ordenação não é estável nem interessante.
    const more = await screen.findByRole('link', { name: /Ver os 11 resultados em Consultas/ })

    expect(screen.getAllByRole('link', { name: /Fernanda/ })).toHaveLength(5)
    expect(more).toHaveAttribute('href', '/appointments')
  })

  /**
   * Achado por acidente, escrevendo o teste acima com um id de nove dígitos: uma
   * resposta que não passa no parse zera aquela lista, e o diálogo anunciava
   * "nada encontrado para fernanda" com cara séria, sobre dados que estavam lá.
   */
  it('não chama de "nada encontrado" o que na verdade não carregou', async () => {
    withAccount()
    server.use(
      http.get(`${config.apiBaseUrl}/babies/${babyId}/appointments`, () => HttpResponse.error()),
    )

    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByRole('searchbox'), 'fernanda')

    expect(await screen.findByText(/alguma lista não carregou/)).toBeInTheDocument()
    expect(screen.queryByText(/Nada encontrado/)).not.toBeInTheDocument()
  })

  it('diz que não achou, com o termo procurado', async () => {
    withAccount()

    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByRole('searchbox'), 'penicilina')

    expect(await screen.findByText(/Nada encontrado para/)).toBeInTheDocument()
  })
})

it('starts in the selected child and can expand the search to the family', async () => {
  withAccount([buildAppointment({ id: APPOINTMENT, babyId, doctorName: 'Dra. Fernanda' })])
  const other = '22222222-2222-4222-8222-222222222222'
  useSelectedBabyStore.setState({ selectedBabyId: other })
  server.use(
    http.get(`${config.apiBaseUrl}/babies`, () =>
      HttpResponse.json([
        buildBaby({ id: babyId, name: 'Elis' }),
        buildBaby({ id: other, name: 'Pedro' }),
      ]),
    ),
    http.get(`${config.apiBaseUrl}/babies/${other}/vaccines`, () =>
      HttpResponse.json({
        groups: [],
        metadata: {
          version: '1',
          sourceName: 'PNI',
          sourceOrganization: 'MS',
          sourceUrl: 'https://example.com',
          sourceUpdatedAt: '2026-01-01',
          effectiveFrom: '2026-01-01',
          minimumAgeInMonths: 0,
          maximumAgeInMonths: 228,
        },
      }),
    ),
    ...['appointments', 'milestones', 'medications'].map((domain) =>
      http.get(`${config.apiBaseUrl}/babies/${other}/${domain}`, () => HttpResponse.json([])),
    ),
  )
  const user = userEvent.setup()
  renderDialog()
  await user.type(screen.getByRole('searchbox'), 'fernanda')
  await user.click(await screen.findByRole('button', { name: 'Buscar em toda a família' }))
  expect(await screen.findByRole('link', { name: /Fernanda/ })).toBeInTheDocument()
  // Changing search scope does not change the page's child until navigation.
  expect(useSelectedBabyStore.getState().selectedBabyId).toBe(other)
  await user.click(screen.getByRole('searchbox'))
  await user.keyboard('{ArrowDown}{Enter}')
  expect(useSelectedBabyStore.getState().selectedBabyId).toBe(babyId)
  expect(useSearchDestinationStore.getState().target?.keys).toEqual([`appointment:${APPOINTMENT}`])
})
it('shows loaded results while another domain is still loading', async () => {
  withAccount([buildAppointment({ id: APPOINTMENT, babyId, doctorName: 'Dr. João' })])
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  server.use(
    http.get(`${config.apiBaseUrl}/babies/${babyId}/medications`, async () => {
      await gate
      return HttpResponse.json([])
    }),
  )
  const user = userEvent.setup()
  renderDialog()
  try {
    await user.type(screen.getByRole('searchbox'), 'joao')
    expect(await screen.findByRole('link', { name: /João/ })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/Procurando/)
  } finally {
    release()
  }
})
it('finds an off-calendar vaccine and passes its exact key to the destination', async () => {
  withAccount()
  server.use(
    http.get(`${config.apiBaseUrl}/babies/${babyId}/vaccines/adhoc`, () =>
      HttpResponse.json([
        {
          id: APPOINTMENT,
          babyId,
          source: 'CUSTOM',
          customName: 'Vacina especial',
          customDose: 'Reforço',
          status: 'APPLIED',
          applicationDate: '2026-09-01',
          notes: null,
          batchNumber: null,
          location: null,
          professional: null,
          photoUrl: null,
        },
      ]),
    ),
  )
  const user = userEvent.setup()
  renderDialog()
  await user.type(screen.getByRole('searchbox'), 'especial')
  await user.click(await screen.findByRole('link', { name: /Vacina especial/ }))
  expect(useSearchDestinationStore.getState().target?.keys).toEqual([`adhoc:${APPOINTMENT}`])
})

it('retries a failed list without losing the query', async () => {
  withAccount()
  let failed = true
  server.use(
    http.get(`${config.apiBaseUrl}/babies/${babyId}/appointments`, () =>
      failed
        ? new HttpResponse(null, { status: 500 })
        : HttpResponse.json([
            buildAppointment({ id: APPOINTMENT, babyId, doctorName: 'Dra. Fernanda' }),
          ]),
    ),
  )
  const user = userEvent.setup()
  renderDialog()
  await user.type(screen.getByRole('searchbox'), 'fernanda')
  await screen.findByRole('alert')
  failed = false
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('link', { name: /Fernanda/ })).toBeInTheDocument()
  expect(screen.getByRole('searchbox')).toHaveValue('fernanda')
})

it('keeps scope navigation inside the popup and Escape closes only the scope menu', async () => {
  withAccount([buildAppointment({ id: APPOINTMENT, babyId, doctorName: 'Dra. Fernanda' })])
  const user = userEvent.setup()
  renderDialog()
  await user.type(screen.getByRole('searchbox'), 'fernanda')
  const result = await screen.findByRole('link', { name: /Fernanda/ })
  await user.click(screen.getByRole('button', { name: 'Buscar em: Toda a família' }))
  expect(await screen.findByRole('menuitemradio', { name: 'Toda a família' })).toHaveFocus()
  await user.keyboard('{ArrowDown}')
  expect(screen.getByRole('menuitemradio', { name: 'Elis' })).toHaveFocus()
  expect(result).not.toHaveFocus()
  expect(useSelectedBabyStore.getState().selectedBabyId).toBeNull()
  await user.keyboard('{Enter}')
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(screen.getByRole('searchbox')).toHaveValue('fernanda')
  expect(screen.getByRole('button', { name: 'Buscar em: Elis' })).toHaveFocus()
  expect(useSelectedBabyStore.getState().selectedBabyId).toBeNull()
  await user.keyboard('{ArrowDown}')
  expect(await screen.findByRole('menu')).toBeInTheDocument()
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(screen.getByRole('searchbox')).toBeInTheDocument()
})
