import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Label } from './label'
import { RadioGroup, RadioGroupItem } from './radio-group'

const meta = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  parameters: {
    docs: {
      description: {
        component:
          'Single-choice input. Each item is paired with a real `<label htmlFor>` so the label text ' +
          'is part of the hit area — which matters more than usual on a phone held in one hand.',
      },
    },
  },
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { defaultValue: 'female' },
  render: (args) => (
    <RadioGroup {...args} aria-label="Sexo">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="female" id="sex-female" />
        <Label htmlFor="sex-female">Feminino</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="male" id="sex-male" />
        <Label htmlFor="sex-male">Masculino</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="unspecified" id="sex-unspecified" />
        <Label htmlFor="sex-unspecified">Prefiro não informar</Label>
      </div>
    </RadioGroup>
  ),
}

export const Disabled: Story = {
  args: { defaultValue: 'female', disabled: true },
  render: Default.render,
}

export const ArrowKeyNavigation: Story = {
  name: 'Interaction — roving focus with arrow keys',
  parameters: {
    docs: {
      description: {
        story:
          'Worth knowing, because it is encoded in the assertions below: in this Radix version the ' +
          'arrow keys move focus but do **not** select. The WAI-ARIA radio group pattern recommends ' +
          'selection following focus, so a keyboard user here has to press Space to commit the ' +
          'choice. Nothing is unreachable by keyboard — it is one extra keystroke, not a barrier.',
      },
    },
  },
  args: { defaultValue: 'female' },
  render: Default.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const female = canvas.getByRole('radio', { name: 'Feminino' })
    const male = canvas.getByRole('radio', { name: 'Masculino' })

    await expect(female).toBeChecked()

    // A radio group is one tab stop; moving between options is arrow keys, not
    // Tab. This asserts the roving tabindex Radix provides still holds.
    female.focus()
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(male).toHaveFocus())

    await userEvent.keyboard(' ')
    await waitFor(() => expect(male).toBeChecked())
    await expect(female).not.toBeChecked()
  },
}
