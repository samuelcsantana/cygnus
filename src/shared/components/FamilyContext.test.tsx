import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { buildBaby } from '@/test/fixtures/baby'
import { renderWithProviders, screen } from '@/test/test-utils'
import { FamilyContext } from './FamilyContext'
const babies = [
  buildBaby({ id: '11111111-1111-4111-8111-111111111111', name: 'Alice', avatarColor: '#6950C7' }),
  buildBaby({ id: '22222222-2222-4222-8222-222222222222', name: 'Bruno' }),
]
function Family() {
  const [id, setId] = useState<string | null>(null)
  return <FamilyContext babies={babies} selectedBabyId={id} onSelectBaby={setId} />
}
it('previews keyboard focus without changing selection, commits with Enter and restores focus', async () => {
  renderWithProviders(<Family />)
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /Selecionar criança/ }))
  expect(screen.getByRole('menuitemradio', { name: 'Todas as crianças' })).toHaveFocus()
  await user.keyboard('{ArrowDown}')
  const alice = screen.getByRole('menuitemradio', { name: 'Alice' })
  expect(alice).toHaveFocus()
  expect(alice).toHaveAttribute('aria-checked', 'false')
  expect(alice.querySelector('[aria-hidden=true]')).toHaveStyle({ backgroundColor: '#6950C7' })
  await user.keyboard('{Enter}')
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Selecionar criança.*Alice/ })).toHaveFocus()
  await user.click(screen.getByRole('button', { name: /Selecionar criança/ }))
  await user.keyboard('{End}{Escape}')
  expect(screen.getByRole('button', { name: /Selecionar criança.*Alice/ })).toHaveFocus()
})
it('keeps the family label consistent with one child and closes on click', async () => {
  const select = vi.fn()
  renderWithProviders(
    <FamilyContext babies={[babies[0]!]} selectedBabyId={null} onSelectBaby={select} />,
  )
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /Todas as crianças/ }))
  expect(screen.getByRole('menuitemradio', { name: 'Todas as crianças' })).toBeChecked()
  await user.click(screen.getByRole('menuitemradio', { name: 'Alice' }))
  expect(select).toHaveBeenCalledWith(babies[0]!.id)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})
it('distinguishes a failed query from an empty family and offers retry', async () => {
  const retry = vi.fn()
  renderWithProviders(
    <FamilyContext
      babies={[]}
      selectedBabyId={null}
      onSelectBaby={vi.fn()}
      error
      onRetry={retry}
    />,
  )
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /Selecionar criança/ }))
  expect(screen.getByRole('alert')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(retry).toHaveBeenCalledOnce()
})
