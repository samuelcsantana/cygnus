import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { config } from '@/lib/config'
import { buildBaby } from '@/test/fixtures/baby'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'

import { MedicationsRoute } from './MedicationsRoute'

const babyId = '11111111-1111-4111-8111-111111111111'
const baby = buildBaby({ id: babyId, name: 'Elis' })

function medication(overrides: Record<string, unknown> = {}) {
  return {
    id: '55555555-5555-4555-8555-555555555555',
    babyId,
    name: 'Vitamina D',
    dosage: '5 gotas',
    frequency: '1x ao dia',
    reason: null,
    prescriberName: null,
    startedOn: '2026-01-10',
    endedOn: null,
    notes: null,
    createdAt: '2026-01-10T00:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  server.use(http.get(`${config.apiBaseUrl}/babies`, () => HttpResponse.json([baby])))
})

describe('MedicationsRoute', () => {
  /**
   * O aviso é a razão de esta tela poder existir. Tudo o mais no app registra o passado; "5 gotas,
   * 1x ao dia" numa tela é indistinguível de uma instrução se ninguém disser o contrário — e este
   * app não recomenda, não lembra e não sabe se a criança tomou.
   */
  it('diz que é registro e não orientação, antes de qualquer dose aparecer', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/babies/:babyId/medications`, () => HttpResponse.json([medication()])),
    )

    renderWithProviders(<MedicationsRoute />)

    await waitFor(() => {
      expect(screen.getByText('Isto é um registro, não uma orientação')).toBeInTheDocument()
    })
    expect(screen.getByText(/não recomenda medicamento/)).toBeInTheDocument()
  })

  /**
   * "Sem fim registrado" e não "em uso": o app sabe o que alguém escreveu, não o que a criança está
   * tomando hoje. O rótulo mais fraco é o único verdadeiro.
   */
  it('rotula o curso aberto pelo que o registro sabe, não pelo que ele sugere', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/babies/:babyId/medications`, () => HttpResponse.json([medication()])),
    )

    renderWithProviders(<MedicationsRoute />)

    await waitFor(() => {
      expect(screen.getByText('Sem fim registrado')).toBeInTheDocument()
    })
    expect(screen.queryByText('Em uso')).not.toBeInTheDocument()
  })

  it('mostra primeiro o que não tem fim registrado, e o histórico depois', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/babies/:babyId/medications`, () =>
        HttpResponse.json([
          medication({
            id: '66666666-6666-4666-8666-666666666666',
            name: 'Amoxicilina',
            startedOn: '2026-02-01',
            endedOn: '2026-02-08',
          }),
          medication({
            id: '77777777-7777-4777-8777-777777777777',
            name: 'Vitamina D',
            startedOn: '2025-06-01',
            endedOn: null,
          }),
        ]),
      ),
    )

    renderWithProviders(<MedicationsRoute />)

    await waitFor(() => {
      expect(screen.getByText('Amoxicilina')).toBeInTheDocument()
    })

    const names = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    // O que está aberto vem antes mesmo tendo começado antes: é o que a pessoa abre a tela para ver.
    expect(names).toEqual(['Vitamina D', 'Amoxicilina'])
  })

  it('encerra um curso com a data de hoje', async () => {
    let receivedBody: Record<string, unknown> = {}
    server.use(
      http.get(`${config.apiBaseUrl}/babies/:babyId/medications`, () => HttpResponse.json([medication()])),
      http.patch(`${config.apiBaseUrl}/babies/:babyId/medications/:medicationId`, async ({ request }) => {
        receivedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(medication({ endedOn: '2026-09-04' }))
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<MedicationsRoute />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Encerrar' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Encerrar' }))

    await waitFor(() => {
      // Só `endedOn` no corpo: encerrar não pode tocar em mais nada do registro.
      expect(Object.keys(receivedBody)).toEqual(['endedOn'])
    })
  })

  it('não oferece encerrar um curso que já acabou', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/babies/:babyId/medications`, () =>
        HttpResponse.json([medication({ endedOn: '2026-02-08' })]),
      ),
    )

    renderWithProviders(<MedicationsRoute />)

    await waitFor(() => {
      expect(screen.getByText('Encerrado')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: 'Encerrar' })).not.toBeInTheDocument()
  })
})
