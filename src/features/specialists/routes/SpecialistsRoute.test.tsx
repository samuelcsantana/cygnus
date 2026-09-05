import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { config } from '@/lib/config'
import { buildBaby } from '@/test/fixtures/baby'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'

import { SpecialistsRoute } from './SpecialistsRoute'

const ME = '00000000-0000-0000-0000-000000000000'
const SOMEBODY_ELSE = '99999999-9999-4999-8999-999999999999'
const babyId = '11111111-1111-4111-8111-111111111111'

function specialist(overrides: Record<string, unknown> = {}) {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    userId: ME,
    name: 'Dra. Fernanda Lima',
    specialty: 'Pediatria',
    phone: '+55 11 99999-0000',
    babyIds: [],
    sharedWithUserIds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  server.use(
    http.get(`${config.apiBaseUrl}/babies`, () => HttpResponse.json([buildBaby({ id: babyId, name: 'Elis' })])),
  )
})

describe('SpecialistsRoute', () => {
  /**
   * A diferença entre "guardei um telefone" e "guardei e o outro responsável vê" é invisível numa
   * lista, e é justamente a decisão que a pessoa acabou de tomar. A legenda de cada cartão é o que
   * a torna visível.
   */
  it('diz quando a entrada é só sua e quando ela atende alguém', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/specialists`, () =>
        HttpResponse.json([
          specialist({ id: '11111111-1111-4111-8111-111111111112', name: 'Só minha' }),
          specialist({ id: '22222222-2222-4222-8222-222222222222', name: 'Da Elis', babyIds: [babyId] }),
        ]),
      ),
    )

    renderWithProviders(<SpecialistsRoute />)

    await waitFor(() => {
      expect(screen.getByText('Só minha')).toBeInTheDocument()
    })
    expect(screen.getByText('Só na sua lista')).toBeInTheDocument()
    expect(screen.getByText('Atende Elis')).toBeInTheDocument()
  })

  /**
   * A API responde 404 para quem não é dono, então um botão de editar seria um botão que sempre
   * falha. Enxergar não é possuir, e a tela precisa dizer isso pela ausência do controle.
   */
  it('não oferece editar nem remover o que é de outra pessoa', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/specialists`, () =>
        HttpResponse.json([
          specialist({ name: 'Da outra responsável', userId: SOMEBODY_ELSE, babyIds: [babyId] }),
        ]),
      ),
    )

    renderWithProviders(<SpecialistsRoute />)

    await waitFor(() => {
      expect(screen.getByText('Da outra responsável')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Remover/ })).not.toBeInTheDocument()
  })

  it('cadastra um profissional já ligado à criança marcada', async () => {
    let receivedBody: Record<string, unknown> = {}
    server.use(
      http.get(`${config.apiBaseUrl}/specialists`, () => HttpResponse.json([])),
      http.post(`${config.apiBaseUrl}/specialists`, async ({ request }) => {
        receivedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(specialist({ babyIds: [babyId] }), { status: 201 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<SpecialistsRoute />)

    await user.click(await screen.findByRole('button', { name: 'Adicionar o primeiro' }))
    await user.type(screen.getByLabelText('Nome'), 'Dra. Fernanda Lima')
    await user.type(screen.getByLabelText('Telefone'), '+55 11 99999-0000')
    await user.click(screen.getByLabelText('Elis'))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(receivedBody).toMatchObject({
        name: 'Dra. Fernanda Lima',
        phone: '+55 11 99999-0000',
        babyIds: [babyId],
      })
    })
  })

  it('mostra o telefone como link discável, que é o motivo de a lista existir', async () => {
    server.use(http.get(`${config.apiBaseUrl}/specialists`, () => HttpResponse.json([specialist()])))

    renderWithProviders(<SpecialistsRoute />)

    await waitFor(() => {
      expect(screen.getByText('Dra. Fernanda Lima')).toBeInTheDocument()
    })
    // Sem espaços no href: um `tel:` com espaço não disca em parte dos aparelhos.
    expect(screen.getByRole('link', { name: '+55 11 99999-0000' })).toHaveAttribute(
      'href',
      'tel:+551199999-0000',
    )
  })
})
