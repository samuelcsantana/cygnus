import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'

import { SearchInput } from './SearchInput'

const meta = {
  title: 'Shared/SearchInput',
  component: SearchInput,
  parameters: {
    docs: {
      description: {
        component:
          'Search field for the vaccine, appointment and milestone lists. The label is real but ' +
          '`sr-only`: the magnifier makes the purpose obvious to a sighted user, and the ' +
          'off-screen `<label>` keeps it obvious to a screen reader — a placeholder alone would ' +
          'not, since it disappears as soon as the user types.',
      },
    },
  },
  args: {
    id: 'vaccine-search',
    label: 'Buscar vacina',
    placeholder: 'Buscar por nome da vacina…',
    value: '',
    // Every story drives the value from local state in `render`; this default
    // only exists to satisfy the component's required prop.
    onChange: fn(),
  },
  argTypes: {
    onChange: { table: { disable: true } },
  },
} satisfies Meta<typeof SearchInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value)
    return <SearchInput {...args} value={value} onChange={setValue} className="w-80" />
  },
}

export const Filled: Story = {
  args: { value: 'tríplice' },
  render: Default.render,
}

export const LabelIsAssociated: Story = {
  name: 'Interaction — the off-screen label works',
  render: Default.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // getByLabelText only resolves if the sr-only <label> is genuinely wired to
    // the input — which is the whole point of the component.
    const input = canvas.getByLabelText<HTMLInputElement>('Buscar vacina')

    await userEvent.type(input, 'BCG')
    await expect(input).toHaveValue('BCG')
  },
}
