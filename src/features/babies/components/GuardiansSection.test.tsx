import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { config } from '@/lib/config'
import i18n from '@/lib/i18n'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor, within } from '@/test/test-utils'
import { GuardiansSection } from './GuardiansSection'

const api = (path: string) => config.apiBaseUrl + path
const owner = { userId: '11111111-1111-4111-8111-111111111111', name: 'Owner', email: 'owner@example.com', role: 'OWNER', joinedAt: '2026-01-01' }
const guest = { userId: '22222222-2222-4222-8222-222222222222', name: 'Guest', email: 'guest@example.com', role: 'GUARDIAN', joinedAt: '2026-01-01' }
const t = (key: string) => i18n.t(key)
afterEach(() => {
  useAuthIdentityStore.getState().clearIdentity()
  vi.restoreAllMocks()
})
function setup(identity = owner) {
  useAuthIdentityStore.getState().setIdentity({ id: identity.userId, email: identity.email, name: identity.name })
  server.use(http.get(api('/babies/child/guardians'), () => HttpResponse.json([owner, guest])))
  renderWithProviders(<GuardiansSection babyId="child" babyName="Ana" />)
}

describe('guardian access management', () => {
  it('generates a targeted invitation, copies the link and allows another invitation', async () => {
    const user = userEvent.setup()
    const payload = vi.fn()
    server.use(http.post(api('/babies/child/invites'), async ({ request }) => {
      payload(await request.json())
      return HttpResponse.json({ code: 'invite-code', expiresAt: '2027-01-01' })
    }))
    setup()
    await screen.findByText('Guest')
    await user.click(screen.getByRole('button', { name: t('babies.guardians.inviteAction') }))
    await user.type(screen.getByLabelText(t('babies.guardians.invite.emailLabel')), 'guest@example.com')
    await user.click(screen.getByRole('button', { name: t('babies.guardians.invite.generateAction') }))
    const link = await screen.findByLabelText(t('babies.guardians.invite.linkLabel'))
    expect(link).toHaveValue(window.location.origin + '/invites/invite-code')
    expect(payload).toHaveBeenCalledWith({ inviteeEmail: 'guest@example.com' })
    await user.click(screen.getByRole('button', { name: t('babies.guardians.invite.copyAction') }))
    expect(await navigator.clipboard.readText()).toBe(window.location.origin + '/invites/invite-code')
    await user.click(screen.getByRole('button', { name: t('babies.guardians.invite.newInviteAction') }))
    expect(screen.getByLabelText(t('babies.guardians.invite.emailLabel'))).toBeVisible()
  })

  it('reports invitation failures and keeps the email for retry', async () => {
    const error = vi.spyOn(toast, 'error')
    server.use(http.post(api('/babies/child/invites'), () => new HttpResponse(null, { status: 500 })))
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: t('babies.guardians.inviteAction') }))
    await user.type(screen.getByLabelText(t('babies.guardians.invite.emailLabel')), 'guest@example.com')
    await user.click(screen.getByRole('button', { name: t('babies.guardians.invite.generateAction') }))
    await waitFor(() => expect(error).toHaveBeenCalledWith(t('babies.guardians.invite.genericError')))
    expect(screen.getByLabelText(t('babies.guardians.invite.emailLabel'))).toHaveValue('guest@example.com')
  })

  it.each([true, false])('requires confirmation before an owner removes another guardian (success: %s)', async (success) => {
    const remove = vi.fn(() => success ? new HttpResponse(null, { status: 204 }) : new HttpResponse(null, { status: 500 }))
    const feedback = vi.spyOn(toast, success ? 'success' : 'error')
    server.use(http.delete(api('/babies/child/guardians/' + guest.userId), remove))
    const user = userEvent.setup()
    setup()
    await screen.findByText('Guest')
    expect(screen.queryByRole('button', { name: i18n.t('babies.guardians.removeAction', { name: 'Owner' }) })).not.toBeInTheDocument()
    const trigger = screen.getByRole('button', { name: i18n.t('babies.guardians.removeAction', { name: 'Guest' }) })
    await user.click(trigger)
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: t('babies.guardians.confirmDismiss') }))
    expect(remove).not.toHaveBeenCalled()
    await user.click(trigger)
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: t('babies.guardians.removeConfirmAction') }))
    await waitFor(() => expect(remove).toHaveBeenCalledOnce())
    await waitFor(() => expect(feedback).toHaveBeenCalledWith(t(success ? 'babies.guardians.removeSuccessToast' : 'babies.guardians.removeGenericError')))
  })

  it('lets a guest leave their own shared access without exposing owner removal', async () => {
    const remove = vi.fn(() => new HttpResponse(null, { status: 204 }))
    server.use(http.delete(api('/babies/child/guardians/' + guest.userId), remove))
    const user = userEvent.setup()
    setup(guest)
    await screen.findByText('Guest')
    expect(screen.queryByRole('button', { name: i18n.t('babies.guardians.removeAction', { name: 'Owner' }) })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: t('babies.guardians.leaveAction') }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: t('babies.guardians.leaveConfirmAction') }))
    await waitFor(() => expect(remove).toHaveBeenCalledOnce())
  })
})
