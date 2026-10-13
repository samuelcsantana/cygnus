import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

const resetRequestUrl = `${config.apiBaseUrl}/auth/password-reset/request`
const resetVerifyUrl = `${config.apiBaseUrl}/auth/password-reset/verify`

function renderReset(onExit: (email: string) => void = () => {}) {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<AuthAssistedFlow mode="reset" initialEmail="" onExit={onExit} />} />
        <Route path="/dashboard" element={<p>Painel</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AuthAssistedFlow password reset', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // The code and the new password travel in one request, so the code step only collects the code
  // and the password step sends both. Sending the code alone would spend it with no password set.
  it('collects the code, then the new password, and sends them together before signing in', async () => {
    let sent: unknown
    server.use(
      http.post(resetRequestUrl, () => HttpResponse.json({ status: 'ok', message: 'sent' })),
      http.post(resetVerifyUrl, async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ status: 'ok', message: 'reset' })
      }),
    )
    const user = userEvent.setup()
    renderReset()

    await submitEmail(user)
    await user.type(await screen.findByLabelText('Código de 6 dígitos'), '482913')
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(sent).toBeUndefined()

    await user.type(await screen.findByLabelText('Nova senha'), 'An0ther-Password')
    await user.type(screen.getByLabelText('Confirme a nova senha'), 'An0ther-Password')
    await user.click(screen.getByRole('button', { name: 'Salvar e entrar' }))

    expect(await screen.findByText('Painel')).toBeInTheDocument()
    expect(sent).toEqual({ email: 'parent@example.com', code: '482913', password: 'An0ther-Password' })
  })

  it('offers another code only after the cooldown, and says one was sent', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const info = vi.spyOn(toast, 'info')
    let requests = 0
    server.use(http.post(resetRequestUrl, () => { requests += 1; return HttpResponse.json({ status: 'ok', message: 'sent' }) }))
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderReset()

    await submitEmail(user)
    expect(await screen.findByRole('button', { name: /Reenviar em \d+s/ })).toBeDisabled()

    await vi.advanceTimersByTimeAsync(60_000)
    await user.click(await screen.findByRole('button', { name: 'Reenviar código' }))

    await waitFor(() => expect(info).toHaveBeenCalledWith('Enviamos outro código.'))
    expect(requests).toBe(2)
  })

  // The URL does not change between steps, so the browser's back button would leave the site; the
  // flow's own "Voltar" steps back one screen at a time and, from the first, hands the e-mail back.
  it('steps back one screen at a time, and leaves with the e-mail already typed', async () => {
    server.use(http.post(resetRequestUrl, () => HttpResponse.json({ status: 'ok', message: 'sent' })))
    const onExit = vi.fn()
    const user = userEvent.setup()
    renderReset(onExit)

    await submitEmail(user)
    await user.type(await screen.findByLabelText('Código de 6 dígitos'), '482913')
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    await screen.findByLabelText('Nova senha')

    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(await screen.findByLabelText('Código de 6 dígitos')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(await screen.findByLabelText('E-mail')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(onExit).toHaveBeenCalledWith('parent@example.com')
  })
})
