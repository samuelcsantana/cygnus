import type { Meta, StoryObj } from '@storybook/react-vite'

import { Skeleton } from './skeleton'

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    docs: {
      description: {
        component:
          'Loading placeholder. It is deliberately shaped like the content it replaces, so the ' +
          'layout does not shift when the request resolves. Note that it is visually distinct from ' +
          'the error and empty states — the accessibility pass checked that all three read ' +
          'differently on each of the five main screens.',
      },
    },
  },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { className: 'h-4 w-48' },
}

export const VaccineListLoading: Story = {
  name: 'Vaccine list loading',
  render: () => (
    <div className="w-80 space-y-4">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  ),
}
