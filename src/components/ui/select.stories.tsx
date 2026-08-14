import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Label } from './label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

const SPECIALTIES = [
  'Pediatria',
  'Neuropediatria',
  'Cardiologia pediátrica',
  'Dermatologia',
  'Oftalmologia',
  'Odontopediatria',
]

const meta = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    docs: {
      description: {
        component:
          'Used for the appointment specialty picker, among others. The options come from the ' +
          "backend's `GET /specialties` endpoint — that route was added specifically because the " +
          'frontend had been shipping a picker against an endpoint that did not exist.',
      },
    },
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className="grid w-64 gap-2">
      <Label htmlFor="specialty">Especialidade</Label>
      <Select {...args}>
        <SelectTrigger id="specialty">
          <SelectValue placeholder="Selecione…" />
        </SelectTrigger>
        <SelectContent>
          {SPECIALTIES.map((specialty) => (
            <SelectItem key={specialty} value={specialty}>
              {specialty}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ),
}

export const WithValue: Story = {
  args: { defaultValue: 'Pediatria' },
  render: Default.render,
}

export const Disabled: Story = {
  args: { disabled: true },
  render: Default.render,
}

export const SelectingAnOption: Story = {
  name: 'Interaction — keyboard selection',
  render: Default.render,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const screen = within(document.body)
    const trigger = canvas.getByRole('combobox', { name: 'Especialidade' })

    await step('opens with the keyboard alone', async () => {
      trigger.focus()
      await userEvent.keyboard('{Enter}')
      await waitFor(() => expect(screen.getByRole('listbox')).toBeVisible())
    })

    await step('commits the chosen option to the trigger', async () => {
      await userEvent.click(screen.getByRole('option', { name: 'Neuropediatria' }))
      await waitFor(() => expect(trigger).toHaveTextContent('Neuropediatria'))
    })
  },
}
