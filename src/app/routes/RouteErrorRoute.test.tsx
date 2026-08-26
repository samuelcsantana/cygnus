import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { renderWithProviders } from '@/test/test-utils'

import { RouteErrorRoute } from './RouteErrorRoute'

/**
 * Monta um roteador cuja única rota estoura, para exercitar o `errorElement`
 * pelo caminho real — o React Router só o usa quando *ele* pega o erro, e um
 * render direto do componente não provaria isso.
 */
function renderComErro(erro: unknown) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        errorElement: <RouteErrorRoute />,
        loader: () => {
          throw erro
        },
        element: <p>nunca deveria aparecer</p>,
      },
    ],
    { initialEntries: ['/'] },
  )
  return renderWithProviders(<RouterProvider router={router} />)
}

describe('RouteErrorRoute', () => {
  it('reconhece um chunk que sumiu e explica que o app foi atualizado', async () => {
    renderComErro(new TypeError('Failed to fetch dynamically imported module: /assets/VaccinesRoute-abc123.js'))

    expect(await screen.findByText('Este app foi atualizado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recarregar página' })).toBeInTheDocument()
    // e nunca a tela de desenvolvimento do próprio roteador
    expect(screen.queryByText(/Unexpected Application Error/i)).not.toBeInTheDocument()
  })

  it('cai na mensagem genérica para qualquer outro erro', async () => {
    renderComErro(new Error('algo completamente diferente'))

    expect(await screen.findByText('Algo deu errado')).toBeInTheDocument()
    expect(screen.queryByText('Este app foi atualizado')).not.toBeInTheDocument()
  })

  it('reconhece também as mensagens do Firefox e do Safari', async () => {
    renderComErro(new TypeError('error loading dynamically imported module'))
    expect(await screen.findByText('Este app foi atualizado')).toBeInTheDocument()
  })

  it('offline, atribui o mesmo erro à falta de rede e não manda recarregar à toa', async () => {
    const original = Object.getOwnPropertyDescriptor(window.navigator, 'onLine')
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => false })
    try {
      renderComErro(new TypeError('Failed to fetch dynamically imported module: /assets/X-abc.js'))
      expect(await screen.findByText('Sem conexão')).toBeInTheDocument()
      expect(screen.queryByText('Este app foi atualizado')).not.toBeInTheDocument()
    } finally {
      if (original) Object.defineProperty(window.navigator, 'onLine', original)
    }
  })
})
