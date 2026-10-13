import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { I18nextProvider } from 'react-i18next'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { currentUserQueryKey } from '@/features/auth/api/auth.hooks'
import { config } from '@/lib/config'
import i18n from '@/lib/i18n'
import { queryClient, setUnauthorizedHandler } from '@/lib/query-client'
import { server } from '@/test/msw/server'
import { screen, waitFor } from '@/test/test-utils'

import { InviteRedeemRoute } from './InviteRedeemRoute'

const CODE = 'b42d94621332d2066af7d92829a2d6da'

/**
 * **Renderiza com o `queryClient` do app, não com o de teste.** Essa é a única
 * razão deste wrapper existir em vez de `renderWithProviders`.
 *
 * O `renderWithProviders` cria um QueryClient novo por teste, e o gating de
 * 401 vive no `queryCache.onError` do cliente **real** — então um teste que use
 * o cliente de teste passa com e sem a correção, que foi exatamente o que
 * aconteceu na primeira versão deste arquivo. Um teste que não falha sem a
 * correção não protege nada.
 */
function renderWithRealClient() {
  void i18n.changeLanguage('pt-BR')
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/invites/${CODE}`]}>
          <Routes>
            <Route path="/invites/:code" element={<InviteRedeemRoute />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
  // O cliente é compartilhado entre os testes deste arquivo: sem isso o
  // `/auth/me` de um teste fica em cache e o seguinte nunca chega a falhar.
  queryClient.clear()
  setUnauthorizedHandler(() => {})
})

/**
 * Esta rota fica fora do ProtectedLayout de propósito, para que quem seguiu um
 * link de convite consiga lê-lo antes de entrar. Isso só se sustenta enquanto o
 * `GET /auth/me` que ela mesma dispara puder responder 401 sem ser tratado como
 * sessão expirada.
 *
 * Regrediu exatamente uma vez, em silêncio: o 401 acionava o handler global,
 * que faz `window.location.assign('/login')`, e o convite nunca pintava. A tela
 * ficava inalcançável para o único público que ela tem — e nada falhava, porque
 * de fora o redirecionamento parece comportamento normal.
 */
describe('InviteRedeemRoute para visitante deslogado', () => {
  it('mostra o convite em vez de ser expulso pelo próprio 401', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)

    server.use(
      http.get(`${config.apiBaseUrl}/auth/me`, () => HttpResponse.json({ status: 'error' }, { status: 401 })),
      http.get(`${config.apiBaseUrl}/invites/${CODE}`, () =>
        HttpResponse.json({ babyName: 'Ana', babyAvatarUrl: null, expired: false, alreadyUsed: false }),
      ),
    )

    renderWithRealClient()

    await waitFor(() => {
      expect(screen.getByText(/Ana/)).toBeInTheDocument()
    })

    // A asserção que importa. Só verificar que o nome apareceu passaria mesmo
    // com um redirecionamento sendo disparado por baixo.
    await waitFor(() => {
      expect(onUnauthorized).not.toHaveBeenCalled()
    })
  })

  it('ainda trata um 401 sem a marcação como sessão expirada', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)

    server.use(http.get(`${config.apiBaseUrl}/babies`, () => HttpResponse.json({ status: 'error' }, { status: 401 })))

    // Uma query qualquer sem `meta.expectsAnonymous` — o caminho do shell
    // protegido, onde o 401 é expiração de verdade e o redirecionamento é a
    // resposta certa. Sem este caso, a correção poderia ter desligado o handler
    // para todo mundo e o outro teste continuaria verde.
    await queryClient
      .fetchQuery({
        queryKey: ['teste', 'sem-meta'],
        queryFn: async () => {
          const response = await fetch(`${config.apiBaseUrl}/babies`)
          if (!response.ok) {
            const { ApiError } = await import('@/lib/http-client')
            throw new ApiError(response.status, undefined, 'unauthorized')
          }
          return null
        },
        retry: false,
      })
      .catch(() => null)

    expect(onUnauthorized).toHaveBeenCalled()
  })
})

function LocationProbe() {
  const location = useLocation()
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>
}

function renderWithDestinations() {
  void i18n.changeLanguage('pt-BR')
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/invites/${CODE}`]}>
          <Routes>
            <Route path="/invites/:code" element={<InviteRedeemRoute />} />
            <Route path="/login" element={<LocationProbe />} />
            <Route path="/dashboard" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const previewOfAna = () =>
  http.get(`${config.apiBaseUrl}/invites/${CODE}`, () =>
    HttpResponse.json({ babyName: 'Ana', babyAvatarUrl: null, expired: false, alreadyUsed: false }),
  )

// The accept button acts on whether /auth/me has answered, so each test waits for that answer
// before clicking, as a person reading the invite would.
async function acceptOnceTheSessionIsKnown(status: 'success' | 'error') {
  await waitFor(() => expect(queryClient.getQueryState(currentUserQueryKey)?.status).toBe(status))
  await userEvent.setup().click(await screen.findByRole('button', { name: 'Aceitar convite' }))
}

describe('accepting an invite', () => {
  it('sends a visitor without a session to sign in, with the way back to this invite', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/auth/me`, () => HttpResponse.json({ status: 'error' }, { status: 401 })),
      previewOfAna(),
    )
    renderWithDestinations()

    await acceptOnceTheSessionIsKnown('error')

    expect(await screen.findByTestId('location')).toHaveTextContent(`/login?redirectTo=${encodeURIComponent(`/invites/${CODE}`)}`)
  })

  it('makes a signed-in parent a guardian, says so, and opens the dashboard', async () => {
    const success = vi.spyOn(toast, 'success')
    server.use(
      previewOfAna(),
      http.post(`${config.apiBaseUrl}/invites/${CODE}/redeem`, () =>
        HttpResponse.json({ babyId: '11111111-1111-4111-8111-111111111111', babyName: 'Ana' }),
      ),
    )
    renderWithDestinations()

    await acceptOnceTheSessionIsKnown('success')

    expect(await screen.findByTestId('location')).toHaveTextContent('/dashboard')
    expect(success).toHaveBeenCalledWith('Você agora ajuda a cuidar de Ana!')
  })

  it.each([
    [409, 'Você já é responsável por este perfil.'],
    [410, 'Este convite expirou ou já foi usado.'],
    [500, 'Não foi possível aceitar o convite. Tente novamente.'],
  ])('explains a %i from the server and stays on the invite', async (status, message) => {
    const error = vi.spyOn(toast, 'error')
    server.use(
      previewOfAna(),
      http.post(`${config.apiBaseUrl}/invites/${CODE}/redeem`, () => HttpResponse.json({ status: 'error' }, { status })),
    )
    renderWithDestinations()

    await acceptOnceTheSessionIsKnown('success')

    await waitFor(() => expect(error).toHaveBeenCalledWith(message))
    expect(screen.queryByTestId('location')).not.toBeInTheDocument()
  })
})
