import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'

import { AuthAssistedFlow } from './AuthAssistedFlow'

const requestUrl = `${config.apiBaseUrl}/auth/passwordless/request`
const verifyUrl = `${config.apiBaseUrl}/auth/passwordless/verify`

// renderWithProviders gives i18n and Query but no router, and this component
// navigates to /dashboard on success — so it supplies its own.
function renderFlow() {
  return renderWithProviders(
    <MemoryRouter>
      <AuthAssistedFlow mode="passwordless" initialEmail="" onExit={() => {}} />
    </MemoryRouter>,
  )
}

async function submitEmail(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('E-mail'), 'parent@example.com')
  await user.click(screen.getByRole('button', { name: 'Enviar código' }))
}

/**
 * The three failures the API can answer with are three different situations for
 * the person in front of the screen, and the only thing distinguishing them is
 * the status code. Collapsing 429 into the generic "try again" is what this
 * covers: that message tells someone to do the one thing that cannot work.
 */
describe('AuthAssistedFlow error mapping', () => {
  it('tells the user to wait when the API rate-limits the request', async () => {
    server.use(http.post(requestUrl, () => HttpResponse.json({ status: 'error' }, { status: 429 })))

    const user = userEvent.setup()
    renderFlow()
    await submitEmail(user)

    await waitFor(() => {
      expect(screen.getByText(/Muitas tentativas em pouco tempo/)).toBeInTheDocument()
    })
  })

  it('blames the code, not the connection, on a 401 from verify', async () => {
    server.use(
      http.post(requestUrl, () => HttpResponse.json({ status: 'ok', message: 'sent' })),
      http.post(verifyUrl, () => HttpResponse.json({ status: 'error' }, { status: 401 })),
    )

    const user = userEvent.setup()
    renderFlow()
    await submitEmail(user)

    const codeInput = await screen.findByLabelText('Código de 6 dígitos')
    await user.type(codeInput, '000000')
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(screen.getByText('Código inválido ou expirado.')).toBeInTheDocument()
    })
  })

  it('falls back to the generic message on a failure the user cannot act on', async () => {
    server.use(http.post(requestUrl, () => HttpResponse.json({ status: 'error' }, { status: 500 })))

    const user = userEvent.setup()
    renderFlow()
    await submitEmail(user)

    await waitFor(() => {
      expect(screen.getByText('Não foi possível continuar. Tente novamente.')).toBeInTheDocument()
    })
  })
})
