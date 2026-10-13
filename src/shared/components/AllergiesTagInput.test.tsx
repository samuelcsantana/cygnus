import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders, screen } from '@/test/test-utils'

import { AllergiesTagInput } from './AllergiesTagInput'

function Harness({ initial = [] }: { initial?: string[] }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <label htmlFor="allergies">Alergias</label>
      <AllergiesTagInput id="allergies" value={value} onChange={setValue} removeLabel={(item) => `Remover ${item}`} />
      <output aria-label="valor">{value.join('|')}</output>
    </>
  )
}

const recorded = () => screen.getByLabelText('valor').textContent

describe('AllergiesTagInput', () => {
  it('records an allergy on Enter or comma, trimmed, and clears the field for the next', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    const input = screen.getByLabelText('Alergias')

    await user.type(input, '  Amendoim  {Enter}Lactose,')

    expect(recorded()).toBe('Amendoim|Lactose')
    expect(input).toHaveValue('')
  })

  it('records what was typed when the field loses focus, so a parent who taps away keeps it', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    await user.type(screen.getByLabelText('Alergias'), 'Dipirona')
    await user.tab()

    expect(recorded()).toBe('Dipirona')
  })

  it('does not record the same allergy twice, or an empty one', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness initial={['Amendoim']} />)

    await user.type(screen.getByLabelText('Alergias'), 'Amendoim{Enter}   {Enter}')

    expect(recorded()).toBe('Amendoim')
  })

  it('removes the last allergy on Backspace in an empty field, and any one by its own button', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness initial={['Amendoim', 'Lactose', 'Ovo']} />)

    await user.type(screen.getByLabelText('Alergias'), '{Backspace}')
    expect(recorded()).toBe('Amendoim|Lactose')

    await user.click(screen.getByRole('button', { name: 'Remover Amendoim' }))
    expect(recorded()).toBe('Lactose')
  })
})
