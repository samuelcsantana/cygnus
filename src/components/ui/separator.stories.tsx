import type { Meta, StoryObj } from '@storybook/react-vite'

import { Separator } from './separator'

const meta = {
  title: 'UI/Separator',
  component: Separator,
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    decorative: { control: 'boolean' },
  },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: (args) => (
    <div className="w-72">
      <p className="text-ink text-sm font-semibold">Helena</p>
      <p className="text-ink-muted text-xs">1 ano e 3 meses</p>
      <Separator {...args} className="my-3" />
      <p className="text-ink-muted text-xs">Próxima vacina em 12 dias</p>
    </div>
  ),
}

export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div className="flex h-10 items-center gap-3 text-sm">
      <span>18 doses</span>
      <Separator {...args} />
      <span>4 consultas</span>
      <Separator {...args} />
      <span>9 marcos</span>
    </div>
  ),
}
