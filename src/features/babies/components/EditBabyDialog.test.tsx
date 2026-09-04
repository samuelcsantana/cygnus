import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { buildBaby } from '@/test/fixtures/baby'
import { renderWithProviders, screen, waitFor, within } from '@/test/test-utils'

import { EditBabyDialog } from './EditBabyDialog'

const sampleBaby = buildBaby({ name: 'Alice', birthDate: '2024-03-10' })

describe('EditBabyDialog delete flow', () => {
  it('does not delete the baby on the first click — asks for confirmation first', async () => {
    let deleteCallCount = 0
    server.use(
      http.delete(`${config.apiBaseUrl}/babies/:babyId`, () => {
        deleteCallCount += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<EditBabyDialog baby={sampleBaby} onOpenChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: "Excluir perfil de Alice" }))

    expect(deleteCallCount).toBe(0)
    expect(screen.getByText('Excluir perfil?')).toBeInTheDocument()
  })

  it('only deletes the baby after the confirmation is accepted', async () => {
    let deleteCallCount = 0
    server.use(
      http.delete(`${config.apiBaseUrl}/babies/:babyId`, () => {
        deleteCallCount += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderWithProviders(<EditBabyDialog baby={sampleBaby} onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: "Excluir perfil de Alice" }))

    const confirmDialog = screen.getByRole('alertdialog')
    await user.click(within(confirmDialog).getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(deleteCallCount).toBe(1)
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('leaves the baby untouched when the confirmation is dismissed', async () => {
    let deleteCallCount = 0
    server.use(
      http.delete(`${config.apiBaseUrl}/babies/:babyId`, () => {
        deleteCallCount += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<EditBabyDialog baby={sampleBaby} onOpenChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: "Excluir perfil de Alice" }))
    const confirmDialog = screen.getByRole('alertdialog')
    await user.click(within(confirmDialog).getByRole('button', { name: 'Cancelar' }))

    expect(deleteCallCount).toBe(0)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('shows an inline error when deletion fails', async () => {
    server.use(http.delete(`${config.apiBaseUrl}/babies/:babyId`, () => HttpResponse.json(null, { status: 500 })))

    const user = userEvent.setup()
    renderWithProviders(<EditBabyDialog baby={sampleBaby} onOpenChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: "Excluir perfil de Alice" }))
    const confirmDialog = screen.getByRole('alertdialog')
    await user.click(within(confirmDialog).getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(screen.getByText('Não foi possível excluir o perfil. Tente novamente.')).toBeInTheDocument()
    })
  })
})
