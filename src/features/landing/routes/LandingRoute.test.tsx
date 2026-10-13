import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { config } from '@/lib/config'
import i18n from '@/lib/i18n'
import { queryClient, setUnauthorizedHandler } from '@/lib/query-client'
import { server } from '@/test/msw/server'
import { screen, waitFor } from '@/test/test-utils'

import { LandingRoute } from './LandingRoute'

/**
 * The app's real QueryClient, for the same reason InviteRedeemRoute.test.tsx
 * gives: the 401 handling lives in that client's cache, and a test client
 * would pass with or without `expectsAnonymous`.
 */
function renderAtRoot() {
  void i18n.changeLanguage('pt-BR')
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route path="/" element={<LandingRoute />} />
              <Route path="/dashboard" element={<p>dashboard</p>} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

function setSessionHint() {
  document.cookie = 'csrf_token=test-token; path=/'
}

// The header carries the theme button, and jsdom has no matchMedia for ThemeProvider to read.
beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.cookie = 'csrf_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  queryClient.clear()
  setUnauthorizedHandler(() => {})
})

describe('LandingRoute', () => {
  it('shows the landing page to a visitor without asking the API anything', async () => {
    const requests: string[] = []
    const record = ({ request }: { request: Request }) => requests.push(new URL(request.url).pathname)
    server.events.on('request:start', record)

    renderAtRoot()

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Vacinas, consultas e crescimento dos seus filhos, num lugar só.',
    )
    // A cold Render instance takes about a minute to answer; a visitor with no
    // session must never wait on it.
    expect(requests.filter((path) => path.endsWith('/auth/me'))).toEqual([])
    server.events.removeListener('request:start', record)
  })

  it('sends someone with a session to the dashboard, as / always did', async () => {
    setSessionHint()

    renderAtRoot()

    expect(await screen.findByText('dashboard')).toBeInTheDocument()
  })

  it('shows the landing page when the session hint is stale, without the expired-session redirect', async () => {
    setSessionHint()
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    server.use(
      http.get(`${config.apiBaseUrl}/auth/me`, () => HttpResponse.json({ status: 'error', message: 'Authentication required' }, { status: 401 })),
      http.post(`${config.apiBaseUrl}/auth/refresh`, () => HttpResponse.json({ status: 'error', message: 'Invalid token' }, { status: 401 })),
    )

    renderAtRoot()

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    await waitFor(() => expect(onUnauthorized).not.toHaveBeenCalled())
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument()
  })

  it('shows a demo session the landing page, whose demo button returns to that demo', async () => {
    setSessionHint()
    const demoStarts: string[] = []
    server.use(
      http.get(`${config.apiBaseUrl}/auth/me`, () =>
        HttpResponse.json({
          id: '00000000-0000-0000-0000-000000000001',
          email: 'demo-1@demo.cygnus.invalid',
          name: 'Marina',
          createdAt: '2026-10-13T00:00:00.000Z',
          demoExpiresAt: '2026-10-14T00:00:00.000Z',
        }),
      ),
      http.post(`${config.apiBaseUrl}/auth/demo`, ({ request }) => {
        demoStarts.push(request.url)
        return HttpResponse.json({ demoExpiresAt: '2026-10-14T00:00:00.000Z' }, { status: 201 })
      }),
    )

    renderAtRoot()

    // The back button from inside the demo lands here; a redirect to the
    // dashboard made it look broken.
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument()

    screen.getAllByRole('button', { name: /Ver demonstração/ }).at(0)?.click()

    expect(await screen.findByText('dashboard')).toBeInTheDocument()
    // Back to the running demo, not a new account: a second one would drop
    // what the visitor changed and spend the address's hourly allowance.
    expect(demoStarts).toEqual([])
  })
})
