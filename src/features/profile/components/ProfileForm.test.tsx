import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import type { User } from '@/features/auth/api/auth.schemas'
import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'

import { ProfileForm } from './ProfileForm'

const sampleUser: User = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'parent@example.com',
  name: 'Jane Doe',
  createdAt: '2024-01-01T00:00:00.000Z',
}

describe('ProfileForm', () => {
  /**
   * A senha atual só é exigida pelo backend quando o e-mail muda, e agora só aparece nesse caso.
   * Pedi-la para salvar o nome era pedido sem motivo — e campo de senha sem motivo é como se
   * aprende a digitar senha sem perguntar por quê.
   */
  it('só pede a senha atual depois que o e-mail muda', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProfileForm user={sampleUser} />)

    expect(screen.queryByLabelText('Senha atual')).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText('E-mail'))
    await user.type(screen.getByLabelText('E-mail'), 'outro@example.com')

    await waitFor(() => {
      expect(screen.getByLabelText('Senha atual')).toBeInTheDocument()
    })
  })

  it('saves a name-only change without sending currentPassword', async () => {
    let receivedBody: unknown = null
    server.use(
      http.patch(`${config.apiBaseUrl}/users/me`, async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ ...sampleUser, name: 'Jane Smith' })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<ProfileForm user={sampleUser} />)

    const nameInput = screen.getByLabelText('Nome completo')
    await user.clear(nameInput)
    await user.type(nameInput, 'Jane Smith')
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))

    await waitFor(() => {
      expect(receivedBody).toEqual({ name: 'Jane Smith', email: undefined, currentPassword: undefined })
    })
  })

  it('rejects an email change without a current password, without calling the API', async () => {
    let callCount = 0
    server.use(
      http.patch(`${config.apiBaseUrl}/users/me`, () => {
        callCount += 1
        return HttpResponse.json(sampleUser)
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<ProfileForm user={sampleUser} />)

    const emailInput = screen.getByLabelText('E-mail')
    await user.clear(emailInput)
    await user.type(emailInput, 'new@example.com')
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))

    await waitFor(() => {
      expect(screen.getByText('Informe sua senha atual para alterar o e-mail.')).toBeInTheDocument()
    })
    expect(callCount).toBe(0)
  })

  it('shows a generic error banner when the server rejects the update', async () => {
    server.use(http.patch(`${config.apiBaseUrl}/users/me`, () => HttpResponse.json(null, { status: 500 })))

    const user = userEvent.setup()
    renderWithProviders(<ProfileForm user={sampleUser} />)

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))

    await waitFor(() => {
      expect(screen.getByText('Não foi possível salvar. Tente novamente.')).toBeInTheDocument()
    })
  })
})
