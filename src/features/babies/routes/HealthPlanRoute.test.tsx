import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'

import { config } from '@/lib/config'
import i18n from '@/lib/i18n'
import { buildBaby } from '@/test/fixtures/baby'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'
import { HealthPlanRoute } from './HealthPlanRoute'

const api = (path: string) => config.apiBaseUrl + path
const t = (key: string) => i18n.t(key)
afterEach(() => vi.restoreAllMocks())
function renderRoute() {
  return renderWithProviders(<MemoryRouter initialEntries={['/plano']}>
    <Routes><Route path="/plano" element={<HealthPlanRoute />} />
      <Route path="/dashboard" element={<h1>Family dashboard</h1>} /></Routes>
  </MemoryRouter>)
}
describe('health plan management', () => {
  it('redirects families without children to the dashboard', async () => {
    renderRoute()
    expect(await screen.findByRole('heading', { name: 'Family dashboard' })).toBeVisible()
  })

  it('shows a load error instead of an empty form after an API failure', async () => {
    server.use(http.get(api('/babies'), () => new HttpResponse(null, { status: 500 })))
    renderRoute()
    expect(await screen.findByText(t('babies.dashboard.loadError'))).toBeVisible()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('saves plan changes without losing the child profile and refreshes the saved form', async () => {
    let baby = buildBaby({ name: 'Ana', bloodType: 'A+', allergies: ['Milk'], avatarUrl: 'https://example.com/ana.png' })
    const submitted = vi.fn()
    server.use(
      http.get(api('/babies'), () => HttpResponse.json([baby])),
      http.patch(api('/babies/:id'), async ({ request }) => {
        const body = await request.json() as Record<string, unknown>
        submitted(body)
        baby = { ...baby, healthPlanName: 'Family Care', healthPlanNumber: '1234' }
        return HttpResponse.json(baby)
      }),
    )
    const user = userEvent.setup()
    renderRoute()
    const name = await screen.findByLabelText(t('babies.form.healthPlanNameLabel'))
    const save = screen.getByRole('button', { name: t('healthPlan.saveAction') })
    expect(save).toBeDisabled()
    await user.type(name, 'Family Care')
    await user.type(screen.getByLabelText(t('babies.form.healthPlanNumberLabel')), '1234')
    await user.click(save)
    await waitFor(() => expect(submitted).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Ana', birthDate: '2024-01-01', sexAtBirth: 'FEMALE', bloodType: 'A+',
      allergies: ['Milk'], avatarUrl: 'https://example.com/ana.png',
      healthPlanName: 'Family Care', healthPlanNumber: '1234',
    })))
    await waitFor(() => expect(save).toBeDisabled())
    expect(name).toHaveValue('Family Care')
  })

  it('keeps unsaved edits available when saving fails', async () => {
    const error = vi.spyOn(toast, 'error')
    server.use(
      http.get(api('/babies'), () => HttpResponse.json([buildBaby()])),
      http.patch(api('/babies/:id'), () => new HttpResponse(null, { status: 500 })),
    )
    const user = userEvent.setup()
    renderRoute()
    const name = await screen.findByLabelText(t('babies.form.healthPlanNameLabel'))
    await user.type(name, 'Family Care')
    await user.click(screen.getByRole('button', { name: t('healthPlan.saveAction') }))
    await waitFor(() => expect(error).toHaveBeenCalledWith(t('healthPlan.genericError')))
    expect(name).toHaveValue('Family Care')
    expect(screen.getByRole('button', { name: t('healthPlan.saveAction') })).toBeEnabled()
  })
})
