import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/test-utils'

import { AddBabyDialog } from './AddBabyDialog'

describe('AddBabyDialog', () => {
  it('closes without calling the API when the close button is clicked', async () => {
    let postCallCount = 0
    server.use(
      http.post(`${config.apiBaseUrl}/babies`, () => {
        postCallCount += 1
        return HttpResponse.json(null, { status: 201 })
      }),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderWithProviders(<AddBabyDialog open onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(postCallCount).toBe(0)
  })

  it('blocks advancing to the health step without the required profile fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddBabyDialog open onOpenChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => {
      expect(screen.getByText('Valor muito curto.')).toBeInTheDocument()
    })
    expect(screen.queryByLabelText('Tipo Sanguíneo')).not.toBeInTheDocument()
  })

  it('creates the baby (with an uploaded avatar) across both steps and closes the dialog', async () => {
    let postCallCount = 0
    let receivedBody: Record<string, unknown> = {}
    server.use(
      http.post(`${config.apiBaseUrl}/babies`, async ({ request }) => {
        postCallCount += 1
        receivedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
          {
            id: '11111111-1111-4111-8111-111111111111',
            userId: '22222222-2222-4222-8222-222222222222',
            name: 'Miguel',
            birthDate: '2024-03-10',
            gender: 'MALE',
            bloodType: null,
            allergies: [],
            avatarUrl: 'https://example.com/miguel.jpg',
            avatarColor: null,
            createdAt: '2024-03-10T00:00:00.000Z',
          },
          { status: 201 },
        )
      }),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderWithProviders(<AddBabyDialog open onOpenChange={onOpenChange} />)

    await user.type(screen.getByLabelText('Nome da Criança'), 'Miguel')
    fireEvent.change(screen.getByLabelText('Data de Nascimento'), { target: { value: '2024-03-10' } })
    await user.click(screen.getAllByRole('radio', { name: 'Menino' })[0]!)

    const avatarUrl = 'https://example.com/miguel.jpg'
    await user.type(screen.getByPlaceholderText('Cole uma URL ou envie uma foto'), avatarUrl)
    expect(screen.getByAltText('')).toHaveAttribute('src', avatarUrl)

    await user.click(screen.getByRole('button', { name: 'Cor 1' }))
    expect(screen.getByAltText('').parentElement).toHaveStyle({ borderColor: '#2A9D8F' })

    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Tipo Sanguíneo')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'Criar Perfil' }))

    await waitFor(() => {
      expect(postCallCount).toBe(1)
    })
    expect(receivedBody.avatarUrl).toBe(avatarUrl)
    expect(receivedBody.avatarColor).toBe('#2A9D8F')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('rejects a future birth date inline, without advancing to the health step', async () => {
    let postCallCount = 0
    server.use(
      http.post(`${config.apiBaseUrl}/babies`, () => {
        postCallCount += 1
        return HttpResponse.json(null, { status: 201 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<AddBabyDialog open onOpenChange={vi.fn()} />)

    await user.type(screen.getByLabelText('Nome da Criança'), 'Miguel')

    const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 10)
    fireEvent.change(screen.getByLabelText('Data de Nascimento'), { target: { value: tomorrow } })

    await user.click(screen.getAllByRole('radio', { name: 'Menino' })[0]!)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => {
      expect(screen.getByText('A data de nascimento não pode ser no futuro.')).toBeInTheDocument()
    })

    expect(screen.queryByLabelText('Tipo Sanguíneo')).not.toBeInTheDocument()
    expect(postCallCount).toBe(0)
  })

  it('rejects an oversized avatar file with an inline error', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddBabyDialog open onOpenChange={vi.fn()} />)

    const oversizedFile = new File([new Uint8Array(11 * 1024 * 1024)], 'huge.png', { type: 'image/png' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, oversizedFile)

    await waitFor(() => {
      expect(screen.getByText('A imagem deve ter no máximo 10MB.')).toBeInTheDocument()
    })
  })
})
