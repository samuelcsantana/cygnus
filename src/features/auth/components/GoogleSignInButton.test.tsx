import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { config } from '@/lib/config'
import { renderWithProviders } from '@/test/test-utils'
import { server } from '@/test/msw/server'
import { GoogleSignInButton } from './GoogleSignInButton'

describe('GoogleSignInButton', () => {
  it('disables Google when the server has not configured it', async () => {
    renderWithProviders(<GoogleSignInButton />)
    expect(await screen.findByText(/Login com Google indisponível/)).toBeVisible()
    expect(screen.getByRole('button', { name: /Google/ })).toBeDisabled()
  })
  it('starts a browser-bound login and only redirects to Google', async () => {
    const url = 'https://accounts.google.com/o/oauth2/v2/auth?state=random'
    const redirect = vi.fn()
    server.use(
      http.get(`${config.apiBaseUrl}/auth/google/status`, () => HttpResponse.json({ enabled: true })),
      http.post(`${config.apiBaseUrl}/auth/google/start`, () => HttpResponse.json({ url })),
    )
    renderWithProviders(<GoogleSignInButton onRedirect={redirect} />)
    const button = screen.getByRole('button', { name: /Google/ })
    await waitFor(() => expect(button).toBeEnabled())
    await userEvent.click(button)
    await waitFor(() => expect(redirect).toHaveBeenCalledExactlyOnceWith(url))
    expect(button).toBeDisabled()
  })
  it('rejects an unexpected redirect destination and allows another attempt', async () => {
    const redirect = vi.fn()
    server.use(
      http.get(`${config.apiBaseUrl}/auth/google/status`, () => HttpResponse.json({ enabled: true })),
      http.post(`${config.apiBaseUrl}/auth/google/start`, () => HttpResponse.json({ url: 'https://attacker.example/' })),
    )
    renderWithProviders(<GoogleSignInButton onRedirect={redirect} />)
    const button = screen.getByRole('button', { name: /Google/ })
    await waitFor(() => expect(button).toBeEnabled())
    await userEvent.click(button)
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível entrar')
    expect(redirect).not.toHaveBeenCalled()
    expect(button).toBeEnabled()
  })
  it('recovers from an availability request failure', async () => {
    server.use(http.get(`${config.apiBaseUrl}/auth/google/status`, () => new HttpResponse(null, { status: 503 })))
    renderWithProviders(<GoogleSignInButton />)
    const retry = await screen.findByRole('button', { name: 'Tentar novamente' })
    server.use(http.get(`${config.apiBaseUrl}/auth/google/status`, () => HttpResponse.json({ enabled: true })))
    await userEvent.click(retry)
    await waitFor(() => expect(screen.getByRole('button', { name: /Google/ })).toBeEnabled())
  })
})
