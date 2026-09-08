import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { act, renderWithProviders, screen, waitFor } from '@/test/test-utils'
import { buildBaby } from '@/test/fixtures/baby'
import { SpecialistEditor, type SpecialistEditorProps } from './SpecialistEditor'

const baby = buildBaby({ name: 'Alice' })
const guardian = {
  userId: '99999999-9999-4999-8999-999999999999',
  name: 'Marina',
  email: 'marina@example.com',
}
const base: SpecialistEditorProps = {
  babies: [baby],
  guardians: [guardian],
  specialties: [],
  retryBabies: vi.fn(),
  retryGuardians: vi.fn(),
  retrySpecialties: vi.fn(),
  onOpenChange: vi.fn(),
  onSave: vi.fn().mockResolvedValue(undefined),
}

describe('SpecialistEditor', () => {
  it('validates the name and explains access through children and individual shares', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    renderWithProviders(<SpecialistEditor {...base} onSave={onSave} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Adicionar profissional' }))
    expect(screen.getByText('Informe o nome do profissional.')).toBeVisible()
    expect(onSave).not.toHaveBeenCalled()
    await user.type(screen.getByLabelText('Nome'), '  Dra. Ana  ')
    await user.click(screen.getByRole('checkbox', { name: 'Alice' }))
    expect(
      screen.getByText('Você e todos os responsáveis das crianças selecionadas.'),
    ).toBeVisible()
    await user.click(screen.getByRole('checkbox', { name: /Marina/ }))
    await user.click(screen.getByRole('button', { name: 'Adicionar profissional' }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Dra. Ana',
        babyIds: [baby.id],
        sharedWithUserIds: [guardian.userId],
      }),
    )
  })

  it('preserves the draft when data refreshes and asks before discarding it', async () => {
    const onOpenChange = vi.fn()
    const { rerender } = renderWithProviders(
      <SpecialistEditor {...base} onOpenChange={onOpenChange} />,
    )
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Nome'), 'Dra. Ana')
    await user.click(screen.getByRole('checkbox', { name: 'Alice' }))
    rerender(<SpecialistEditor {...base} babies={[{ ...baby }]} onOpenChange={onOpenChange} />)
    expect(screen.getByLabelText('Nome')).toHaveValue('Dra. Ana')
    expect(screen.getByRole('checkbox', { name: 'Alice' })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByRole('alertdialog')).toBeVisible()
    expect(onOpenChange).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Continuar editando' }))
    expect(screen.getByLabelText('Nome')).toHaveValue('Dra. Ana')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('locks closing and editing while saving, then preserves values on failure for retry', async () => {
    let rejectSave!: (error: Error) => void
    const onSave = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((_resolve, reject) => {
            rejectSave = reject
          }),
      )
      .mockResolvedValue(undefined)
    const onOpenChange = vi.fn()
    renderWithProviders(<SpecialistEditor {...base} onSave={onSave} onOpenChange={onOpenChange} />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Nome'), 'Dra. Ana')
    await user.click(screen.getByRole('button', { name: 'Adicionar profissional' }))
    await waitFor(() => expect(screen.getByLabelText('Nome')).toBeDisabled())
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeDisabled()
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalled()
    await act(async () => rejectSave(new Error('offline')))
    expect(await screen.findByRole('alert')).toBeVisible()
    expect(screen.getByLabelText('Nome')).toHaveValue('Dra. Ana')
    await user.click(screen.getByRole('button', { name: 'Adicionar profissional' }))
    expect(onSave).toHaveBeenCalledTimes(2)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('preserves existing links when reference lists cannot load and supports clearing optional fields', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    renderWithProviders(
      <SpecialistEditor
        {...base}
        onSave={onSave}
        babies={[]}
        guardians={[]}
        babiesError
        guardiansError
        specialist={{
          id: guardian.userId,
          userId: guardian.userId,
          name: 'Ana',
          specialty: 'Pediatria',
          phone: '123',
          babyIds: [baby.id],
          sharedWithUserIds: [guardian.userId],
          createdAt: '2026-01-01T00:00:00Z',
        }}
      />,
    )
    const user = userEvent.setup()
    await user.clear(screen.getByLabelText(/Telefone/))
    await user.clear(screen.getByLabelText(/Especialidade/))
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '',
        specialty: '',
        babyIds: [baby.id],
        sharedWithUserIds: [guardian.userId],
      }),
    )
  })
})
