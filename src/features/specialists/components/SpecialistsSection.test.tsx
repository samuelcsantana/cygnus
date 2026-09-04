import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'

import { SpecialistsSection } from './SpecialistsSection'

const babyId = '11111111-1111-4111-8111-111111111111'

function specialist(overrides: Record<string, unknown> = {}) {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    babyId,
    name: 'Dra. Fernanda Lima',
    specialty: 'Pediatria',
    phone: '+55 11 99999-0000',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('SpecialistsSection', () => {
  it('mostra o telefone como link discável, que é o motivo de a lista existir', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/babies/:babyId/specialists`, () => HttpResponse.json([specialist()])),
    )

    renderWithProviders(<SpecialistsSection babyId={babyId} />)

    await waitFor(() => {
      expect(screen.getByText('Dra. Fernanda Lima')).toBeInTheDocument()
    })

    // Sem espaços no href: um `tel:` com espaço não disca em parte dos aparelhos, e o número é
    // exibido como foi digitado justamente porque reformatá-lo pode transformá-lo em outro.
    expect(screen.getByRole('link', { name: '+55 11 99999-0000' })).toHaveAttribute(
      'href',
      'tel:+551199999-0000',
    )
  })

  /**
   * A garantia sobre a qual a feature inteira se apoia, dita para quem vai clicar: arrumar a lista
   * não pode reescrever o histórico. O texto de confirmação afirma isso porque quem apaga algo num
   * app de saúde precisa saber o que **não** vai sumir junto.
   */
  it('avisa que a consulta já registrada continua inteira antes de excluir', async () => {
    let deleted: string | null = null
    server.use(
      http.get(`${config.apiBaseUrl}/babies/:babyId/specialists`, () => HttpResponse.json([specialist()])),
      http.delete(`${config.apiBaseUrl}/babies/:babyId/specialists/:specialistId`, ({ params }) => {
        deleted = params.specialistId as string
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<SpecialistsSection babyId={babyId} />)

    await waitFor(() => {
      expect(screen.getByText('Dra. Fernanda Lima')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Remover Dra. Fernanda Lima' }))

    expect(screen.getByText(/As consultas já registradas continuam inteiras/)).toBeInTheDocument()
    // Um clique não apaga: a confirmação existe e é ela que dispara a chamada.
    expect(deleted).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Remover' }))

    await waitFor(() => {
      expect(deleted).toBe('44444444-4444-4444-8444-444444444444')
    })
  })

  it('diz que a lista está vazia em vez de não dizer nada', async () => {
    server.use(http.get(`${config.apiBaseUrl}/babies/:babyId/specialists`, () => HttpResponse.json([])))

    renderWithProviders(<SpecialistsSection babyId={babyId} />)

    await waitFor(() => {
      expect(screen.getByText('Nenhum profissional salvo ainda.')).toBeInTheDocument()
    })
  })

  it('salva um profissional novo com o telefone', async () => {
    let receivedBody: Record<string, unknown> = {}
    server.use(
      http.get(`${config.apiBaseUrl}/babies/:babyId/specialists`, () => HttpResponse.json([])),
      http.post(`${config.apiBaseUrl}/babies/:babyId/specialists`, async ({ request }) => {
        receivedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(specialist(), { status: 201 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<SpecialistsSection babyId={babyId} />)

    await user.click(screen.getByRole('button', { name: 'Adicionar' }))
    await user.type(screen.getByLabelText('Nome'), 'Dra. Fernanda Lima')
    await user.type(screen.getByLabelText('Telefone'), '+55 11 99999-0000')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(receivedBody).toMatchObject({ name: 'Dra. Fernanda Lima', phone: '+55 11 99999-0000' })
    })
  })
})
