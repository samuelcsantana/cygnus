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
    server.use(
      http.delete(`${config.apiBaseUrl}/users/me`, () => HttpResponse.json(null, { status: 400 })),
    )

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

  /**
   * O caso que a rota do código existe para resolver: conta criada por "entrar
   * sem senha" tem hash aleatório, então **nenhuma senha é a certa** e o campo
   * de senha trancava a pessoa para fora da própria exclusão. O app não
   * consegue descobrir sozinho quem tem senha — o hash aleatório é
   * indistinguível de um de verdade —, então quem diz é a pessoa.
   */
  it('exclui a conta com um código, para quem não tem senha', async () => {
    let deletedWith: unknown = null
    let codeRequested = false
    server.use(
      http.post(`${config.apiBaseUrl}/users/me/deletion-code`, () => {
        codeRequested = true
        return HttpResponse.json({ status: 'ok', message: 'A code is on its way' })
      }),
      http.delete(`${config.apiBaseUrl}/users/me`, async ({ request }) => {
        deletedWith = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const onDeleted = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<DeleteAccountDialog onDeleted={onDeleted} />)

    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    await user.click(screen.getByRole('button', { name: /Não tenho senha/ }))

    await waitFor(() => expect(codeRequested).toBe(true))

    await user.type(screen.getByLabelText('Código de 6 dígitos'), '123456')
    await user.click(screen.getByRole('button', { name: 'Excluir conta permanentemente' }))

    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
    // Só o código sobe: mandar os dois é recusado pelo schema da API.
    expect(deletedWith).toEqual({ code: '123456' })
  })

  it('só deixa confirmar com o código inteiro', async () => {
    server.use(
      http.post(`${config.apiBaseUrl}/users/me/deletion-code`, () =>
        HttpResponse.json({ status: 'ok', message: 'A code is on its way' }),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<DeleteAccountDialog />)

    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    await user.click(screen.getByRole('button', { name: /Não tenho senha/ }))
    await user.type(screen.getByLabelText('Código de 6 dígitos'), '123')

    expect(screen.getByRole('button', { name: 'Excluir conta permanentemente' })).toBeDisabled()
  })
})

it('blocks dismissal during deletion and resets confirmation after closing', async () => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  server.use(
    http.delete(`${config.apiBaseUrl}/users/me`, async () => {
      await gate
      return new HttpResponse(null, { status: 400 })
    }),
  )
  const user = userEvent.setup()
  renderWithProviders(<DeleteAccountDialog />)
  await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
  await user.type(screen.getByLabelText('Confirme sua senha atual'), 'wrong-password')
  await user.click(screen.getByRole('button', { name: 'Excluir conta permanentemente' }))
  try {
    await user.keyboard('{Escape}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  } finally {
    release()
  }
  await screen.findByText('Senha atual incorreta.')
  await user.click(screen.getByRole('button', { name: 'Cancelar' }))
  await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
  expect(screen.getByLabelText('Confirme sua senha atual')).toHaveValue('')
  expect(screen.queryByText('Senha atual incorreta.')).not.toBeInTheDocument()
})
