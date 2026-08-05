import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'

import { DeleteAccountDialog } from './DeleteAccountDialog'

describe('DeleteAccountDialog', () => {
  it('does not call the API just from opening the dialog', async () => {
    let deleteCallCount = 0
    server.use(
      http.delete(`${config.apiBaseUrl}/users/me`, () => {
        deleteCallCount += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<DeleteAccountDialog />)

    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))

    expect(screen.getByText('Excluir conta?')).toBeInTheDocument()
    expect(deleteCallCount).toBe(0)
  })

  it('deletes the account with the entered password and calls onDeleted', async () => {
    let receivedBody: unknown = null
    server.use(
      http.delete(`${config.apiBaseUrl}/users/me`, async ({ request }) => {
        receivedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const user = userEvent.setup()
    const onDeleted = vi.fn()
    renderWithProviders(<DeleteAccountDialog onDeleted={onDeleted} />)

    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    await user.type(screen.getByLabelText('Confirme sua senha atual'), 'my-Password1')
    await user.click(screen.getByRole('button', { name: 'Excluir conta permanentemente' }))

    await waitFor(() => {
      expect(receivedBody).toEqual({ currentPassword: 'my-Password1' })
    })
    expect(onDeleted).toHaveBeenCalled()
  })

  it('keeps the dialog open and shows an error on an incorrect password', async () => {
    server.use(http.delete(`${config.apiBaseUrl}/users/me`, () => HttpResponse.json(null, { status: 400 })))

    const user = userEvent.setup()
    const onDeleted = vi.fn()
    renderWithProviders(<DeleteAccountDialog onDeleted={onDeleted} />)

    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    await user.type(screen.getByLabelText('Confirme sua senha atual'), 'wrong-Password1')
    await user.click(screen.getByRole('button', { name: 'Excluir conta permanentemente' }))

    await waitFor(() => {
      expect(screen.getByText('Senha atual incorreta.')).toBeInTheDocument()
    })
    expect(onDeleted).not.toHaveBeenCalled()
    expect(screen.getByText('Excluir conta?')).toBeInTheDocument()
  })
})
