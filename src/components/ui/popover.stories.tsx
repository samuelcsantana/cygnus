import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './popover'

const meta = {
  title: 'UI/Popover',
  component: Popover,
  parameters: {
    docs: {
      description: {
        component:
          'Anchored overlay for secondary detail. Also the container behind the date picker field, ' +
          'which mounts a `Calendar` inside it.',
      },
    },
  },
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Popover {...args}>
      <PopoverTrigger asChild>
        <Button variant="outline">Por que esta vacina?</Button>
      </PopoverTrigger>
      {/* PopoverContent is a role="dialog" and therefore needs an accessible
          name. Radix does not wire PopoverTitle to it automatically the way
          DialogTitle is wired, so the name has to be supplied at the call site. */}
      <PopoverContent className="w-80" aria-labelledby="vaccine-popover-title">
        <PopoverHeader>
          <PopoverTitle id="vaccine-popover-title">Tríplice Viral</PopoverTitle>
          <PopoverDescription>
            Protege contra sarampo, caxumba e rubéola. Primeira dose aos 12 meses, segunda aos 15 meses,
            conforme o calendário nacional.
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
}

export const DefaultOpen: Story = {
  args: { defaultOpen: true },
  render: Default.render,
}
