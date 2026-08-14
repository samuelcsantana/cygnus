import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'

import type { Baby } from '@/features/babies/api/babies.schemas'

import { BabyFilterChips } from './BabyFilterChips'

function baby(id: string, name: string, avatarColor: string | null = null): Baby {
  return {
    id,
    userId: '00000000-0000-4000-8000-000000000000',
    name,
    birthDate: '2025-03-18',
    gender: 'FEMALE',
    bloodType: null,
    allergies: [],
    avatarUrl: null,
    avatarColor,
    createdAt: '2025-03-18T10:00:00.000Z',
  }
}

const HOUSEHOLD: Baby[] = [
  baby('11111111-1111-4111-8111-111111111111', 'Helena'),
  baby('22222222-2222-4222-8222-222222222222', 'Bento'),
  baby('33333333-3333-4333-8333-333333333333', 'Alice', '#6c63ff'),
]

const meta = {
  title: 'Shared/BabyFilterChips',
  component: BabyFilterChips,
  parameters: {
    docs: {
      description: {
        component:
          'Every list screen shows the whole household at once, so this is how a parent narrows ' +
          'one down to a single child. The selection is plain component state owned by the list — ' +
          'there is deliberately no global "selected baby" store in this app.',
      },
    },
  },
  // Every story drives the selection from local state in `render`, so this
  // default only exists to satisfy the component's required prop.
  args: { onChange: fn() },
  argTypes: {
    onChange: { table: { disable: true } },
  },
} satisfies Meta<typeof BabyFilterChips>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { babies: HOUSEHOLD, value: null },
  render: function Render(args) {
    const [value, setValue] = useState<string | null>(args.value)
    return <BabyFilterChips {...args} value={value} onChange={setValue} />
  },
}

export const SingleChildRendersNothing: Story = {
  name: 'Single child — renders nothing',
  parameters: {
    docs: {
      description: {
        story:
          'Filtering by child is meaningless when there is only one, so the component returns ' +
          '`null` rather than showing a one-option filter. The story below is intentionally blank.',
      },
    },
  },
  args: { babies: HOUSEHOLD.slice(0, 1), value: null },
  render: Default.render,
}

export const SelectingAChild: Story = {
  name: 'Interaction — aria-pressed tracks the selection',
  args: { babies: HOUSEHOLD, value: null },
  render: Default.render,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const allChip = canvas.getByRole('button', { name: /tod/i })
    const bentoChip = canvas.getByRole('button', { name: /bento/i })

    await step('starts on "all"', async () => {
      await expect(allChip).toHaveAttribute('aria-pressed', 'true')
      await expect(bentoChip).toHaveAttribute('aria-pressed', 'false')
    })

    await step('moves the pressed state to the chosen child', async () => {
      await userEvent.click(bentoChip)
      await expect(bentoChip).toHaveAttribute('aria-pressed', 'true')
      await expect(allChip).toHaveAttribute('aria-pressed', 'false')
    })
  },
}
