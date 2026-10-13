import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { renderWithProviders, screen } from '@/test/test-utils'

import { AutocompleteInput } from './AutocompleteInput'

const SPECIALTIES = ['Pediatria', 'Pneumologia pediátrica', 'Dermatologia', 'Cardiologia pediátrica']

function Harness() {
  const [value, setValue] = useState('')
  return (
    <>
      <label htmlFor="specialty">Especialidade</label>
      <AutocompleteInput id="specialty" value={value} onValueChange={setValue} suggestions={SPECIALTIES} />
    </>
  )
}

describe('AutocompleteInput', () => {
  beforeAll(() => {
    // jsdom has no layout; the component scrolls the highlighted option into view.
    Element.prototype.scrollIntoView ??= vi.fn()
  })

  it('narrows the suggestions to what was typed, ignoring case', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    await user.type(screen.getByRole('combobox', { name: 'Especialidade' }), 'PEDI')

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Pediatria',
      'Pneumologia pediátrica',
      'Cardiologia pediátrica',
    ])
  })

  it('moves through the list with the arrow keys, wrapping at both ends, and takes the highlighted one on Enter', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    const input = screen.getByRole('combobox', { name: 'Especialidade' })

    await user.type(input, 'pedi')
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('option', { name: 'Cardiologia pediátrica' })).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Cardiologia pediátrica' }).id)

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('option', { name: 'Pediatria' })).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{Enter}')
    expect(input).toHaveValue('Pediatria')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes the list on Escape and keeps what was typed, since any value is allowed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    const input = screen.getByRole('combobox', { name: 'Especialidade' })

    await user.type(input, 'Derm')
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(input).toHaveValue('Derm')
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('takes a suggestion picked with the pointer', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    const input = screen.getByRole('combobox', { name: 'Especialidade' })

    await user.type(input, 'card')
    await user.pointer({ keys: '[MouseLeft>]', target: screen.getByRole('option', { name: 'Cardiologia pediátrica' }) })

    expect(input).toHaveValue('Cardiologia pediátrica')
  })
})
