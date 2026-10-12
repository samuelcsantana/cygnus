import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'

import { config } from '@/lib/config'
import i18n from '@/lib/i18n'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
import { useAddBabyDialogStore } from '@/shared/stores/addBabyDialog.store'
import { buildBaby } from '@/test/fixtures/baby'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor, within } from '@/test/test-utils'
import { AppShellLayout } from './AppShellLayout'
import { ThemeProvider } from '../providers/ThemeProvider'

const api = (path: string) => config.apiBaseUrl + path
const t = (key: string) => i18n.t(key)
afterEach(() => {
  useAuthIdentityStore.getState().clearIdentity()
  useSelectedBabyStore.getState().select(null)
  useAddBabyDialogStore.getState().close()
  vi.restoreAllMocks()
  localStorage.removeItem('theme')
})
function renderShell() {
  localStorage.setItem('theme', 'light')
  return renderWithProviders(<ThemeProvider><MemoryRouter initialEntries={['/dashboard']}><Routes>
    <Route element={<AppShellLayout />}>
      <Route path="/dashboard" element={<h1>Family records</h1>} />
      <Route path="/profissionais" element={<h1>Professional directory</h1>} />
    </Route>
    <Route path="/login" element={<h1>Sign in again</h1>} />
  </Routes></MemoryRouter></ThemeProvider>)
}
describe('application shell', () => {
  it('reconciles a deleted child selection and lets the family navigate from the mobile menu', async () => {
    useSelectedBabyStore.getState().select('deleted-child')
    server.use(http.get(api('/babies'), () => HttpResponse.json([buildBaby({ name: 'Ana' })])))
    const user = userEvent.setup()
    renderShell()
    await waitFor(() => expect(useSelectedBabyStore.getState().selectedBabyId).not.toBe('deleted-child'))
    expect(screen.getByRole('link', { name: t('nav.skipToContent') })).toHaveAttribute('href', '#conteudo')
    await user.click(screen.getByRole('button', { name: t('nav.openMenu') }))
    const menu = screen.getByRole('dialog')
    await user.click(within(menu).getByRole('link', { name: t('nav.specialists') }))
    expect(await screen.findByRole('heading', { name: 'Professional directory' })).toBeVisible()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it.each([true, false])('only leaves the account after logout is confirmed (success: %s)', async (success) => {
    const identity = { id: '11111111-1111-4111-8111-111111111111', email: 'parent@example.com', name: 'Parent' }
    useAuthIdentityStore.getState().setIdentity(identity)
    const feedback = vi.spyOn(toast, 'error')
    server.use(http.post(api('/auth/logout'), () => success
      ? HttpResponse.json({ status: 'ok', message: 'Signed out' })
      : new HttpResponse(null, { status: 500 })))
    const user = userEvent.setup()
    renderShell()
    await user.click(screen.getByRole('button', { name: t('nav.shell.account') }))
    await user.click(screen.getByRole('button', { name: t('nav.logout') }))
    if (success) {
      expect(await screen.findByRole('heading', { name: 'Sign in again' })).toBeVisible()
      expect(useAuthIdentityStore.getState().identity).toBeNull()
    } else {
      await waitFor(() => expect(feedback).toHaveBeenCalledWith(t('nav.logoutError')))
      expect(screen.getByRole('heading', { name: 'Family records' })).toBeVisible()
      expect(useAuthIdentityStore.getState().identity).toEqual(identity)
    }
  })

  it('marks a demo account, and its ways out sign out before going to sign-up or the landing page', async () => {
    server.use(
      http.get(api('/auth/me'), () => HttpResponse.json({
        id: '00000000-0000-0000-0000-000000000001', email: 'demo-1@demo.cygnus.invalid', name: 'Marina Costa',
        createdAt: '2026-10-12T15:00:00.000Z', demoExpiresAt: '2026-10-13T15:00:00.000Z',
      })),
      http.post(api('/auth/logout'), () => HttpResponse.json({ status: 'ok', message: 'Signed out' })),
    )
    const user = userEvent.setup()
    localStorage.setItem('theme', 'light')
    renderWithProviders(<ThemeProvider><MemoryRouter initialEntries={['/dashboard']}><Routes>
      <Route element={<AppShellLayout />}><Route path="/dashboard" element={<h1>Family records</h1>} /></Route>
      <Route path="/register" element={<h1>Create an account</h1>} />
    </Routes></MemoryRouter></ThemeProvider>)

    const banner = await screen.findByRole('region', { name: t('demo.banner.label') })
    await user.click(within(banner).getByRole('button', { name: t('demo.banner.createAccount') }))

    expect(await screen.findByRole('heading', { name: 'Create an account' })).toBeVisible()
  })

  it('shows no demo banner to a real account', async () => {
    renderShell()
    expect(await screen.findByRole('heading', { name: 'Family records' })).toBeVisible()
    expect(screen.queryByRole('region', { name: t('demo.banner.label') })).not.toBeInTheDocument()
  })

  it('opens and closes global search without leaving the current page', async () => {
    const user = userEvent.setup()
    renderShell()
    await user.click(screen.getByRole('button', { name: t('search.open') }))
    expect(await screen.findByRole('dialog')).toBeVisible()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'Family records' })).toBeVisible()
  })
})
