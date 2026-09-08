import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { config } from '@/lib/config'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
import { buildAppointment } from '@/test/fixtures/appointment'
import { buildBaby } from '@/test/fixtures/baby'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen } from '@/test/test-utils'

import { DashboardRoute } from './DashboardRoute'

const ana = buildBaby({
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Ana',
  birthDate: '2026-01-10',
})
const bento = buildBaby({
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Bento',
  birthDate: '2021-03-02',
})

const EMPTY_CALENDAR = {
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
}

function milestone(id: string, babyId: string, title: string) {
  return {
    id,
    babyId,
    title,
    description: null,
    achievedAt: '2026-05-01',
    category: 'MOTOR',
    photoUrl: null,
    createdAt: '2026-05-01T10:00:00.000Z',
  }
}

/** One milestone each, so a counter that ignores the selection reads 2 instead of 1. */
function withFamily() {
  server.use(
    http.get(`${config.apiBaseUrl}/babies`, () => HttpResponse.json([ana, bento])),
    http.get(`${config.apiBaseUrl}/babies/:babyId/vaccines`, () =>
      HttpResponse.json(EMPTY_CALENDAR),
    ),
    http.get(`${config.apiBaseUrl}/babies/:babyId/appointments`, ({ params }) =>
      HttpResponse.json([
        buildAppointment({
          id:
            params.babyId === ana.id
              ? '33333333-3333-4333-8333-333333333333'
              : '44444444-4444-4444-8444-444444444444',
          babyId: params.babyId as string,
          doctorName: 'Dra. Carla Mendes',
        }),
      ]),
    ),
    http.get(`${config.apiBaseUrl}/babies/:babyId/milestones`, ({ params }) =>
      HttpResponse.json([
        params.babyId === ana.id
          ? milestone('55555555-5555-4555-8555-555555555555', ana.id, 'Sentou sem apoio')
          : milestone('66666666-6666-4666-8666-666666666666', bento.id, 'Andou de bicicleta'),
      ]),
    ),
    http.get(`${config.apiBaseUrl}/babies/:babyId/medications`, () => HttpResponse.json([])),
  )
}

function renderDashboard() {
  return renderWithProviders(
    <MemoryRouter>
      <DashboardRoute />
    </MemoryRouter>,
  )
}

afterEach(() => {
  useSelectedBabyStore.getState().select(null)
})

describe('DashboardRoute e a criança escolhida no menu', () => {
  it('mostra a família inteira quando nenhuma criança está escolhida', async () => {
    withFamily()

    renderDashboard()

    // `getAllBy`: cada nome aparece no cartão da criança e outra vez como
    // legenda nos cartões de resumo. O que importa aqui é que os dois existam.
    expect(await screen.findAllByText('Ana')).not.toHaveLength(0)
    expect(screen.getAllByText('Bento')).not.toHaveLength(0)
  })

  /**
   * O pedido do Samuel em 07/09: clicar na criança e ver **apenas** as
   * informações dela. O cartão é a parte fácil; o que quebra em silêncio são os
   * contadores, que somam o agregado e continuam somando depois do filtro.
   * Aconteceu: o "marcos registrados" ficou marcando 4 com uma criança de 1
   * marco na tela, e só apareceu numa captura.
   */
  it('mostra só a criança escolhida — inclusive nos contadores', async () => {
    withFamily()
    useSelectedBabyStore.getState().select(ana.id)

    renderDashboard()

    expect(await screen.findAllByText('Ana')).not.toHaveLength(0)
    expect(screen.queryByText('Bento')).not.toBeInTheDocument()

    // "1 criança", e não "2 crianças".
    expect(screen.getByText(/1 criança/)).toBeInTheDocument()

    expect(await screen.findByText('Sentou sem apoio')).toBeInTheDocument()
    expect(screen.queryByText('Andou de bicicleta')).not.toBeInTheDocument()
  })
})

it('guides a new family without showing example records', async () => {
  server.use(http.get(`${config.apiBaseUrl}/babies`, () => HttpResponse.json([])))
  renderDashboard()
  expect(await screen.findByRole('button', { name: 'Adicionar meu primeiro filho' })).toBeVisible()
  expect(screen.queryByText('65%')).not.toBeInTheDocument()
  expect(screen.queryByText('Dra. Carla Mendes')).not.toBeInTheDocument()
})
it('offers first actions only after the empty records have loaded', async () => {
  withFamily()
  server.use(
    http.get(`${config.apiBaseUrl}/babies/:babyId/appointments`, () => HttpResponse.json([])),
    http.get(`${config.apiBaseUrl}/babies/:babyId/milestones`, () => HttpResponse.json([])),
  )
  renderDashboard()
  expect(await screen.findByRole('heading', { name: 'Comece por aqui' })).toBeVisible()
  expect(screen.getByRole('link', { name: 'Registrar vacinas já tomadas' })).toHaveAttribute(
    'href',
    '/vaccines',
  )
})
