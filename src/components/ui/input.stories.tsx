import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { Input } from './input'
import { Label } from './label'

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    docs: {
      description: {
        component:
          'Text field. Two accessibility rules are load-bearing here and are demonstrated ' +
          'below: every input has an associated `<label>`, and an error is linked through ' +
          '`aria-describedby` rather than being a red border a screen reader never announces.',
      },
    },
  },
  args: { placeholder: 'Nome do bebê' },
  argTypes: {
    disabled: { control: 'boolean' },
    type: { control: 'select', options: ['text', 'email', 'password', 'date', 'number', 'search'] },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const WithLabel: Story = {
  render: (args) => (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="baby-name">Nome do bebê</Label>
      <Input {...args} id="baby-name" />
    </div>
  ),
}

export const Invalid: Story = {
  name: 'Invalid (aria-invalid + aria-describedby)',
  parameters: {
    docs: {
      description: {
        story:
          'The error message carries an id, the input points at it through `aria-describedby`, ' +
          'and `aria-invalid` marks the state independently of the color change. This is the ' +
          'exact pattern the accessibility pass standardised across the form field components.',
      },
    },
  },
  render: (args) => (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="birth-date">Data de nascimento</Label>
      <Input {...args} id="birth-date" type="date" aria-invalid aria-describedby="birth-date-error" />
      <p id="birth-date-error" className="text-xs text-rose-600 dark:text-rose-300">
        A data de nascimento não pode estar no futuro.
      </p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Data de nascimento')

    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAccessibleDescription('A data de nascimento não pode estar no futuro.')
  },
}

export const Disabled: Story = {
  args: { disabled: true, value: 'Helena', onChange: () => {} },
}

export const Typing: Story = {
  name: 'Interaction — typing',
  render: (args) => (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="guardian-email">E-mail do responsável</Label>
      <Input {...args} id="guardian-email" type="email" placeholder="responsavel@exemplo.com" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText<HTMLInputElement>('E-mail do responsável')

    await userEvent.type(input, 'ana@exemplo.com')
    await expect(input).toHaveValue('ana@exemplo.com')
  },
}
