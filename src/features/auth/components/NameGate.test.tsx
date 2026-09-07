import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen } from '@/test/test-utils'

import { NameGate } from './NameGate'

const USER = {
  id: '00000000-0000-4000-8000-000000000000',
  email: 'quem@example.com',
  emailNotificationsEnabled: true,
  createdAt: '2026-09-07T10:00:00.000Z',
}

function withCurrentUser(name: string) {
  server.use(http.get(`${config.apiBaseUrl}/auth/me`, () => HttpResponse.json({ ...USER, name })))
}

function renderGate() {
  return renderWithProviders(
    <NameGate>
      <p>o app</p>
    </NameGate>,
  )
}

describe('NameGate', () => {
  /**
   * O portão é inerte para toda conta que tem nome — que hoje são todas. É o que
   * permite ele ir ao ar **antes** da API que cria conta sem nome, e não depois:
   * ninguém é saudado como "Boa noite, !" no intervalo entre os dois deploys.
   */
  it('não aparece para quem já tem nome', async () => {
    withCurrentUser('Maria Silva')

    renderGate()

    expect(await screen.findByText('o app')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Como podemos te chamar/ })).not.toBeInTheDocument()
  })

  it('pergunta o nome de quem entrou por código e ainda não tem um', async () => {
    withCurrentUser('')

    renderGate()

    expect(await screen.findByRole('heading', { name: /Como podemos te chamar/ })).toBeInTheDocument()
    expect(screen.queryByText('o app')).not.toBeInTheDocument()
  })

  it('salva o nome e sai da frente do app', async () => {
    withCurrentUser('')
    let patched: unknown = null
    server.use(
      http.patch(`${config.apiBaseUrl}/users/me`, async ({ request }) => {
        patched = await request.json()
        return HttpResponse.json({ ...USER, name: 'Maria Silva' })
      }),
    )

    const user = userEvent.setup()
    renderGate()

    await user.type(await screen.findByLabelText('Seu nome'), 'Maria Silva')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(await screen.findByText('o app')).toBeInTheDocument()
    // Só o nome sobe: `PATCH /users/me` cobra a senha atual quando o e-mail muda,
    // e um payload que sempre carrega o e-mail está a um refactor de esbarrar nisso.
    expect(patched).toEqual({ name: 'Maria Silva' })
  })

  /**
   * A rede falhar aqui não pode trancar ninguém para fora de um prontuário que
   * já é dele. Enquanto a resposta é desconhecida, o app renderiza.
   */
  it('deixa o app passar quando não dá para saber se falta nome', async () => {
    server.use(http.get(`${config.apiBaseUrl}/auth/me`, () => HttpResponse.error()))

    renderGate()

    expect(await screen.findByText('o app')).toBeInTheDocument()
  })
})
