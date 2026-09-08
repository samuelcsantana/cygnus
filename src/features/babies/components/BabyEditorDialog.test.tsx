import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'
import { buildBaby } from '@/test/fixtures/baby'
import { BabyEditorDialog } from './BabyEditorDialog'

describe('BabyEditorDialog', () => {
  it('previews the initial and selected color and confirms unsaved changes', async () => {
    const user = userEvent.setup()
    const close = vi.fn()
    renderWithProviders(<BabyEditorDialog open onSave={vi.fn()} onOpenChange={close} />)
    await user.type(screen.getByLabelText('Nome da Criança'), 'Alice')
    await user.click(screen.getByRole('button', { name: 'Cor 3' }))
    expect(screen.getByTestId('avatar-preview')).toHaveTextContent('A')
    expect(screen.getByTestId('avatar-preview')).toHaveStyle({ backgroundColor: '#B83F52' })
    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(close).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Continuar editando' }))
    expect(screen.getByLabelText('Nome da Criança')).toHaveValue('Alice')
  })
  it('accepts comma measurements and requires a valid date after clearing the current date', async () => {
    const user = userEvent.setup()
    const save = vi.fn().mockResolvedValue(undefined)
    renderWithProviders(<BabyEditorDialog open baby={buildBaby()} onSave={save} onOpenChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /02.*Saúde/ }))
    await user.click(screen.getByRole('button', { name: 'Registrar nova medida' }))
    await user.type(screen.getByLabelText('Peso (kg)'), '4,25')
    await user.clear(screen.getByLabelText('Data da medição'))
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))
    expect(save).not.toHaveBeenCalled()
    expect(await screen.findByText('Informe uma data entre o nascimento e hoje.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Data da medição'), '10042024')
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ weightKg: '4,25', measuredOn: '2024-04-10' })))
  })
})
