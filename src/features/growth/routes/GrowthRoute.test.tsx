import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { config } from '@/lib/config'
import { buildAppointment } from '@/test/fixtures/appointment'
import { buildBaby } from '@/test/fixtures/baby'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'

import { GrowthRoute } from './GrowthRoute'

// The empty state sends people to /appointments, and a <Link> without a router
// throws where the assertion would otherwise read "text not found" — the failure
// names React Router's context, not the missing screen.
function renderRoute() {
  return renderWithProviders(
    <MemoryRouter>
      <GrowthRoute />
    </MemoryRouter>,
  )
}

const babyId = '11111111-1111-4111-8111-111111111111'
// Real UUIDs, because the MSW handler's response is parsed by `appointmentSchema`
// for real: an `id: 'a'` fails validation, the query errors, and the page renders
// "não foi possível carregar" — which reads as a broken component, not a bad fixture.
const FIRST_VISIT = '33333333-3333-4333-8333-333333333333'
const SECOND_VISIT = '44444444-4444-4444-8444-444444444444'

function withData(appointments: ReturnType<typeof buildAppointment>[], baby = buildBaby({ id: babyId, name: 'Elis' })) {
  server.use(
    http.get(`${config.apiBaseUrl}/babies`, () => HttpResponse.json([baby])),
    http.get(`${config.apiBaseUrl}/babies/${babyId}/appointments`, () => HttpResponse.json(appointments)),
  )
}

describe('GrowthRoute', () => {
  it('mostra a medida de cada consulta na tabela', async () => {
    withData([
      buildAppointment({
        id: FIRST_VISIT,
        babyId,
        status: 'COMPLETED',
        scheduledAt: '2024-03-01T10:00:00.000Z',
        weightGrams: 5400,
        heightMillimeters: 580,
      }),
    ])

    renderRoute()

    expect(await screen.findByText('5,4 kg')).toBeInTheDocument()
    expect(screen.getByText('58 cm')).toBeInTheDocument()
  })

  /**
   * O gráfico é `role="img"` com um nome e nenhum ponto focável — a tabela é o
   * equivalente acessível dele. Se a tabela sumir, o gráfico deixa de ser
   * legível para quem não o enxerga, e nada mais no app diz esses números.
   */
  it('dá nome acessível aos dois gráficos', async () => {
    withData([
      buildAppointment({
        id: FIRST_VISIT,
        babyId,
        status: 'COMPLETED',
        scheduledAt: '2024-03-01T10:00:00.000Z',
        weightGrams: 5400,
        heightMillimeters: 580,
      }),
      buildAppointment({
        id: SECOND_VISIT,
        babyId,
        status: 'COMPLETED',
        scheduledAt: '2024-06-01T10:00:00.000Z',
        weightGrams: 7200,
        heightMillimeters: 650,
      }),
    ])

    renderRoute()

    expect(await screen.findByRole('img', { name: /peso de Elis/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /altura de Elis/i })).toBeInTheDocument()
  })

  it('avisa que uma medida sozinha ainda não é uma curva', async () => {
    withData([
      buildAppointment({ id: FIRST_VISIT, babyId, status: 'COMPLETED', weightGrams: 5400 }),
    ])

    renderRoute()

    expect(await screen.findByText(/Uma medida inicia o histórico/i)).toBeInTheDocument()
  })

  /**
   * A consulta ainda por vir não pesou ninguém — e o vazio precisa mandar a
   * pessoa para onde a medida se registra, senão a tela é um beco.
   */
  it('manda para as consultas quando nenhuma delas mediu nada', async () => {
    withData([buildAppointment({ id: FIRST_VISIT, babyId, status: 'SCHEDULED' })])

    renderRoute()

    expect(await screen.findByText('Nenhuma medida registrada')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para as consultas' })).toHaveAttribute('href', '/appointments')
  })

  /**
   * A data da linha vem do calendário **local**, como no cartão da consulta.
   * `scheduledAt.slice(0, 10)` é a data UTC: para uma consulta de fim de dia as
   * duas são dias diferentes, e a linha imprimia uma data que não batia com a
   * idade ao lado — "07/09/2025" contra "1 mês", dois meses depois do
   * nascimento. O fuso do vitest está fixado em `America/Sao_Paulo` justamente
   * para este teste não virar decoração no runner, que roda em UTC.
   */
  it('mostra a data local da consulta, coerente com a idade ao lado', async () => {
    const birthDate = '2025-07-07'
    // 22h locais: em UTC-3 isto é o dia seguinte em UTC.
    const visit = new Date(2025, 8, 7, 22, 0, 0)

    withData(
      [
        buildAppointment({
          id: FIRST_VISIT,
          babyId,
          status: 'COMPLETED',
          scheduledAt: visit.toISOString(),
          weightGrams: 5400,
        }),
      ],
      buildBaby({ id: babyId, name: 'Elis', birthDate }),
    )

    renderRoute()

    expect(await screen.findByText('07/09/2025')).toBeInTheDocument()
    expect(screen.getByText('2 meses')).toBeInTheDocument()
  })

  /**
   * A faixa da OMS é uma para meninos e outra para meninas — não existe neutra.
   * Para quem deixou o sexo ao nascer em branco (opcional desde a #82), desenhar
   * qualquer uma das duas seria inventar a comparação; a tela diz por que não
   * tem faixa e leva a onde se preenche.
   */
  it('explica a ausência da faixa quando o sexo ao nascer está em branco', async () => {
    withData(
      [buildAppointment({ id: FIRST_VISIT, babyId, status: 'COMPLETED', weightGrams: 5400 })],
      buildBaby({ id: babyId, name: 'Elis', sexAtBirth: null }),
    )

    renderRoute()

    expect(await screen.findByText(/não dá para escolher a curva de referência/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Completar o perfil' })).toHaveAttribute('href', '/profile')
  })

  it('mostra a legenda da faixa quando há sexo ao nascer', async () => {
    withData(
      [buildAppointment({ id: FIRST_VISIT, babyId, status: 'COMPLETED', weightGrams: 5400 })],
      buildBaby({ id: babyId, name: 'Elis', sexAtBirth: 'MALE' }),
    )

    renderRoute()

    expect(await screen.findByText(/Faixa da OMS/i)).toBeInTheDocument()
  })

  it('não conta a consulta cancelada que ficou com medida gravada', async () => {
    withData([
      buildAppointment({ id: FIRST_VISIT, babyId, status: 'CANCELLED', weightGrams: 5400 }),
    ])

    renderRoute()

    await waitFor(() => {
      expect(screen.getByText('Nenhuma medida registrada')).toBeInTheDocument()
    })
    expect(screen.queryByText('5,4 kg')).not.toBeInTheDocument()
  })
})
