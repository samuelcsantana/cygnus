import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { config } from '@/lib/config'
import { renderWithProviders } from '@/test/test-utils'
import { server } from '@/test/msw/server'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'
import { GoogleCompleteRoute } from './GoogleCompleteRoute'

function renderRoute(url = '/auth/google/complete') {
  return renderWithProviders(<MemoryRouter initialEntries={[url]}><Routes>
    <Route path="/auth/google/complete" element={<GoogleCompleteRoute />} />
    <Route path="/dashboard" element={<p>Confirmed dashboard</p>} />
  </Routes></MemoryRouter>)
}
describe('GoogleCompleteRoute', () => {
  it('confirms the new session before replacing provisional account identity', async () => {
    useAuthIdentityStore.getState().setIdentity({ id: 'previous', email: 'old@example.com', name: 'Old' })
    renderRoute()
    expect(await screen.findByText('Confirmed dashboard')).toBeVisible()
    await waitFor(() => expect(useAuthIdentityStore.getState().identity?.email).toBe('parent@example.com'))
  })
  it('does not treat a cancelled Google flow as a successful existing session', async () => {
    renderRoute('/auth/google/complete?error=failed')
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível entrar')
    expect(screen.queryByText('Confirmed dashboard')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para entrar' })).toHaveAttribute('href', '/login')
  })
  it('offers email authentication when automatic association is refused', () => {
    renderRoute('/auth/google/complete?error=email_verification_required')
    expect(screen.getByRole('alert')).toHaveTextContent('solicite um código por e-mail')
  })
  it('shows a recoverable error when session confirmation fails', async () => {
    server.use(http.get(`${config.apiBaseUrl}/auth/me`, () => new HttpResponse(null, { status: 503 })))
    renderRoute()
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível entrar')
  })
})
