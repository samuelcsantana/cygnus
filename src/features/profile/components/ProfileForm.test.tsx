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
  it('keeps email read-only and does not request a password', async () => {
    renderWithProviders(<ProfileForm user={sampleUser} />)
    const input = screen.getByLabelText('E-mail')
    expect(input).toHaveAttribute('readonly')
    await userEvent.type(input, 'other@example.com')
    expect(input).toHaveValue(sampleUser.email)
    expect(screen.queryByLabelText('Senha atual')).not.toBeInTheDocument()
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
      expect(receivedBody).toEqual({ name: 'Jane Smith' })
    })
  })

  it('shows a generic error banner when the server rejects the update', async () => {
    server.use(
      http.patch(`${config.apiBaseUrl}/users/me`, () => HttpResponse.json(null, { status: 500 })),
    )

    const user = userEvent.setup()
    renderWithProviders(<ProfileForm user={sampleUser} />)

    await user.type(screen.getByLabelText('Nome completo'), ' Updated')
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))

    await waitFor(() => {
      expect(screen.getByText('Não foi possível salvar. Tente novamente.')).toBeInTheDocument()
    })
  })
})

it('removes a saved photo and enables saving only after a change', async () => {
  let body: unknown
  server.use(
    http.patch(`${config.apiBaseUrl}/users/me`, async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ ...sampleUser, avatarUrl: null })
    }),
  )
  const user = userEvent.setup()
  renderWithProviders(
    <ProfileForm user={{ ...sampleUser, avatarUrl: 'data:image/jpeg;base64,/9j/AA==' }} />,
  )
  expect(screen.getByRole('button', { name: 'Salvar Alterações' })).toBeDisabled()
  await user.click(screen.getByRole('button', { name: 'Remover foto' }))
  await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))
  await waitFor(() => expect(body).toEqual({ name: sampleUser.name, avatarUrl: null }))
})
