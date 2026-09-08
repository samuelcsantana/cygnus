import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { config } from '@/lib/config'
import { LEGAL_DOCUMENTS } from '@/shared/legal'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'
import { ProtectedLayout } from './ProtectedLayout'

const api = (path: string) => config.apiBaseUrl + path
afterEach(() => useAuthIdentityStore.getState().clearIdentity())
function renderRoute() {
  return renderWithProviders(<MemoryRouter initialEntries={['/private']}><Routes>
    <Route element={<ProtectedLayout />}><Route path="/private" element={<h1>Private family records</h1>} /></Route>
    <Route path="/login" element={<h1>Sign in required</h1>} />
  </Routes></MemoryRouter>)
}
describe('protected route session verification', () => {
  it('hydrates identity only from the confirmed profile before showing private content', async () => {
    server.use(http.get(api('/legal/acceptances'), () => HttpResponse.json(
      Object.values(LEGAL_DOCUMENTS).map((doc) => ({ documentId: doc.id, version: doc.version, acceptedAt: '2026-09-08' })),
    )))
    renderRoute()
    expect(await screen.findByRole('heading', { name: 'Private family records' })).toBeVisible()
    await waitFor(() => expect(useAuthIdentityStore.getState().identity).toMatchObject({ name: 'Parent', email: 'parent@example.com' }))
  })
  it('redirects an expired session when silent refresh is also rejected', async () => {
    server.use(
      http.get(api('/auth/me'), () => new HttpResponse(null, { status: 401 })),
      http.post(api('/auth/refresh'), () => new HttpResponse(null, { status: 401 })),
    )
    renderRoute()
    expect(await screen.findByRole('heading', { name: 'Sign in required' })).toBeVisible()
    expect(screen.queryByText('Private family records')).not.toBeInTheDocument()
  })
  it('shows a service failure without treating it as an anonymous session', async () => {
    server.use(http.get(api('/auth/me'), () => HttpResponse.json({ status: 'error', message: 'Service unavailable' }, { status: 503 })))
    renderRoute()
    expect(await screen.findByText('Service unavailable')).toBeVisible()
    expect(screen.queryByText('Sign in required')).not.toBeInTheDocument()
    expect(screen.queryByText('Private family records')).not.toBeInTheDocument()
  })
})
