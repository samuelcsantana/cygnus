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
          'which mounts a `Calendar` inside it.\n\n' +
          '`PopoverContent` is a `role="dialog"`, so it owes an accessible name. Radix wires ' +
          '`DialogTitle` to its dialog automatically but does not do the same here, so this ' +
          'component registers `PopoverTitle`\'s id through context and points `aria-labelledby` ' +
          'at it — the call site gets the name for free instead of having to remember it.',
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
      <PopoverContent className="w-80">
        <PopoverHeader>
          <PopoverTitle>Tríplice Viral</PopoverTitle>
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
