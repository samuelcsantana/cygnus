import type { Meta, StoryObj } from '@storybook/react-vite'

import { Input } from './input'
import { Label } from './label'

const meta = {
  title: 'UI/Label',
  component: Label,
  parameters: {
    docs: {
      description: {
        component:
          'Always bound to a control through `htmlFor`. A floating label with no association is ' +
          'invisible to a screen reader and steals the click target from the input, so it is not ' +
          'an accepted pattern in this codebase (AGENTS.md §7).',
      },
    },
  },
  args: { children: 'Nome do bebê' },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className="grid max-w-sm gap-2">
      <Label {...args} htmlFor="labelled-input" />
      <Input id="labelled-input" placeholder="Helena" />
    </div>
  ),
}

export const Required: Story = {
  render: (args) => (
    <div className="grid max-w-sm gap-2">
      <Label {...args} htmlFor="required-input">
        Nome do bebê
        <span className="text-rose-500" aria-hidden>
          *
        </span>
      </Label>
      <Input id="required-input" required placeholder="Helena" />
    </div>
  ),
}
