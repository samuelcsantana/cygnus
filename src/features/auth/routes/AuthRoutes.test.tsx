import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import i18n from '@/lib/i18n'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'
import { LoginRoute } from './LoginRoute'
import { RegisterRoute } from './RegisterRoute'

const api = (path: string) => config.apiBaseUrl + path
const t = (key: string) => i18n.t(key)
function Destination() {
  return <div data-testid="destination">{useLocation().pathname}</div>
}
function renderAuth(path = '/login') {
  return renderWithProviders(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/login" element={<LoginRoute />} />
    <Route path="/register" element={<RegisterRoute />} />
    <Route path="*" element={<Destination />} />
  </Routes></MemoryRouter>)
}
afterEach(() => useAuthIdentityStore.getState().clearIdentity())

describe('email authentication routes', () => {
  it.each(['/invites/example', '//untrusted.example', 'https://untrusted.example'])(
    'signs in and restricts redirectTo=%s to local destinations',
    async (destination) => {
      const login = vi.fn(async ({ request }: { request: Request }) => {
        expect(await request.json()).toEqual({ email: 'parent@example.com', password: 'safe-password' })
        return HttpResponse.json({ status: 'ok', message: 'Signed in' })
      })
      server.use(http.post(api('/auth/login'), login))
      const user = userEvent.setup()
      renderAuth('/login?redirectTo=' + encodeURIComponent(destination))
      await user.type(screen.getByLabelText(t('auth.login.emailLabel')), 'parent@example.com')
      await user.type(screen.getByLabelText(t('auth.login.passwordLabel')), 'safe-password')
      await user.click(screen.getByRole('button', { name: t('auth.login.submit') }))
      expect(await screen.findByTestId('destination')).toHaveTextContent(
        destination === '/invites/example' ? destination : '/dashboard',
      )
      expect(login).toHaveBeenCalledTimes(1)
      expect(useAuthIdentityStore.getState().identity).toMatchObject({ email: 'parent@example.com', name: null })
    },
  )

  it.each([401, 500])('keeps the login form usable after HTTP %s', async (status) => {
    server.use(http.post(api('/auth/login'), () =>
      HttpResponse.json({ status: 'error', message: 'Rejected' }, { status })))
    const user = userEvent.setup()
    renderAuth()
    await user.type(screen.getByLabelText(t('auth.login.emailLabel')), 'parent@example.com')
    await user.type(screen.getByLabelText(t('auth.login.passwordLabel')), 'wrong')
    await user.click(screen.getByRole('button', { name: t('auth.login.submit') }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      t(status === 401 ? 'auth.login.invalidCredentials' : 'auth.login.genericError'),
    )
    expect(useAuthIdentityStore.getState().identity).toBeNull()
    expect(screen.getByRole('button', { name: t('auth.login.submit') })).toBeEnabled()
  })

  it('rejects empty credentials without making a login request', async () => {
    const login = vi.fn()
    server.use(http.post(api('/auth/login'), login))
    const user = userEvent.setup()
    renderAuth()
    await user.click(screen.getByRole('button', { name: t('auth.login.submit') }))
    await waitFor(() => expect(screen.getByLabelText(t('auth.login.emailLabel'))).toHaveAttribute('aria-invalid', 'true'))
    expect(login).not.toHaveBeenCalled()
  })

  it.each([409, 500])('reports registration failure %s without establishing identity', async (status) => {
    server.use(http.post(api('/auth/register'), () =>
      HttpResponse.json({ status: 'error', message: 'Rejected' }, { status })))
    const user = userEvent.setup()
    renderAuth('/register')
    await user.type(screen.getByLabelText(t('auth.register.nameLabel')), 'Parent')
    await user.type(screen.getByLabelText(t('auth.register.emailLabel')), 'parent@example.com')
    await user.type(screen.getByLabelText(t('auth.register.passwordLabel')), 'safe-password')
    await user.click(screen.getByRole('button', { name: t('auth.register.submit') }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      t(status === 409 ? 'auth.register.emailTaken' : 'auth.register.genericError'),
    )
    expect(useAuthIdentityStore.getState().identity).toBeNull()
  })

  it('registers the validated profile and returns to sign-in', async () => {
    const payload = vi.fn()
    server.use(http.post(api('/auth/register'), async ({ request }) => {
      payload(await request.json())
      return HttpResponse.json({
        id: '11111111-1111-4111-8111-111111111111', email: 'parent@example.com',
        name: 'Parent', createdAt: '2026-01-01T00:00:00Z',
      })
    }))
    const user = userEvent.setup()
    renderAuth('/register')
    await user.type(screen.getByLabelText(t('auth.register.nameLabel')), 'Parent')
    await user.type(screen.getByLabelText(t('auth.register.emailLabel')), 'parent@example.com')
    await user.type(screen.getByLabelText(t('auth.register.passwordLabel')), 'safe-password')
    await user.click(screen.getByRole('button', { name: t('auth.register.submit') }))
    expect(await screen.findByRole('heading', { name: t('auth.login.title') })).toBeVisible()
    expect(payload).toHaveBeenCalledWith({ name: 'Parent', email: 'parent@example.com', password: 'safe-password' })
    expect(useAuthIdentityStore.getState().identity?.name).toBe('Parent')
  })
})
