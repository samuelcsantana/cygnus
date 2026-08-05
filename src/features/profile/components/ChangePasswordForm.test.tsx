import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'

import { ChangePasswordForm } from './ChangePasswordForm'

describe('ChangePasswordForm', () => {
  it('rejects mismatched passwords without calling the API', async () => {
    let callCount = 0
    server.use(
      http.patch(`${config.apiBaseUrl}/users/me`, () => {
        callCount += 1
        return HttpResponse.json(null, { status: 200 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<ChangePasswordForm />)

    await user.type(screen.getByLabelText('Senha atual'), 'current-Password1')
    await user.type(screen.getByLabelText('Nova senha'), 'new-Password1')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'different-Password1')
    await user.click(screen.getByRole('button', { name: 'Atualizar Senha' }))

    await waitFor(() => {
      expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument()
    })
    expect(callCount).toBe(0)
  })

  it('shows an incorrect-current-password message on a 400 response', async () => {
    server.use(http.patch(`${config.apiBaseUrl}/users/me`, () => HttpResponse.json(null, { status: 400 })))

    const user = userEvent.setup()
    renderWithProviders(<ChangePasswordForm />)

    await user.type(screen.getByLabelText('Senha atual'), 'wrong-Password1')
    await user.type(screen.getByLabelText('Nova senha'), 'new-Password1')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'new-Password1')
    await user.click(screen.getByRole('button', { name: 'Atualizar Senha' }))

    await waitFor(() => {
      expect(screen.getByText('Senha atual incorreta.')).toBeInTheDocument()
    })
  })

  it('clears the fields after a successful password change', async () => {
    server.use(
      http.patch(`${config.apiBaseUrl}/users/me`, () =>
        HttpResponse.json({
          id: '00000000-0000-0000-0000-000000000000',
          email: 'parent@example.com',
          name: 'Jane Doe',
          createdAt: '2024-01-01T00:00:00.000Z',
        }),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<ChangePasswordForm />)

    const currentPasswordInput = screen.getByLabelText('Senha atual')
    await user.type(currentPasswordInput, 'current-Password1')
    await user.type(screen.getByLabelText('Nova senha'), 'new-Password1')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'new-Password1')
    await user.click(screen.getByRole('button', { name: 'Atualizar Senha' }))

    await waitFor(() => {
      expect(currentPasswordInput).toHaveValue('')
    })
  })
})
