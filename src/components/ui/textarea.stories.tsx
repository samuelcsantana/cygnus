import type { Meta, StoryObj } from '@storybook/react-vite'

import { Label } from './label'
import { Textarea } from './textarea'

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  args: { placeholder: 'Anotações da consulta…' },
  argTypes: { disabled: { control: 'boolean' } },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const WithLabel: Story = {
  render: (args) => (
    <div className="grid max-w-md gap-2">
      <Label htmlFor="appointment-notes">Observações</Label>
      <Textarea {...args} id="appointment-notes" rows={4} />
    </div>
  ),
}

export const Filled: Story = {
  args: {
    defaultValue:
      'Peso 8,4 kg e altura 71 cm. Pediatra pediu retorno em 60 dias e liberou introdução de ovo cozido.',
  },
  render: (args) => (
    <div className="grid max-w-md gap-2">
      <Label htmlFor="appointment-notes-filled">Observações</Label>
      <Textarea {...args} id="appointment-notes-filled" rows={4} />
    </div>
  ),
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Registro encerrado — não é mais editável.' },
}
