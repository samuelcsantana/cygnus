import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { buildBaby } from '@/test/fixtures/baby'
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
          buildBaby({
            name: 'Miguel',
            birthDate: '2024-03-10',
            gender: 'MALE',
            avatarUrl: 'data:image/jpeg;base64,MIGUEL',
          }),
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

    // O caminho real da foto é escolher um arquivo — o campo de colar URL não existe mais. O jsdom
    // não implementa `createImageBitmap` nem canvas, que é o que a conversão usa, então os dois são
    // dublados aqui: sem isso não há como cobrir este caminho, e antes ele era coberto só por
    // procuração, digitando no campo de URL.
    const dataUrl = 'data:image/jpeg;base64,MIGUEL'
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 200, height: 200, close: vi.fn() })),
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(dataUrl)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, {
      target: { files: [new File(['x'], 'miguel.jpg', { type: 'image/jpeg' })] },
    })

    await waitFor(() => {
      expect(screen.getByAltText('')).toHaveAttribute('src', dataUrl)
    })

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
    expect(receivedBody.avatarUrl).toBe(dataUrl)
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
