import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

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
