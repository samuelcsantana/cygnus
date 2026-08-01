import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/test-utils'

import { BabyForm } from './BabyForm'

describe('BabyForm', () => {
  it('rejects a future birth date inline, without calling the API', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(async () => {})

    renderWithProviders(<BabyForm submitLabel="Criar Perfil" onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Nome da Criança'), 'Miguel')

    const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 10)
    fireEvent.change(screen.getByLabelText('Data de Nascimento'), { target: { value: tomorrow } })

    await user.click(screen.getAllByRole('radio', { name: 'Menino' })[0]!)
    await user.click(screen.getByRole('button', { name: 'Criar Perfil' }))

    await waitFor(() => {
      expect(screen.getByText('A data de nascimento não pode ser no futuro.')).toBeInTheDocument()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
