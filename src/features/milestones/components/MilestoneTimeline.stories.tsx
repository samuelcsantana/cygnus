import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MilestoneCard, MilestoneTimeline } from './MilestoneTimeline'
const memory = {
  id: '33333333-3333-4333-8333-333333333333',
  babyId: '11111111-1111-4111-8111-111111111111',
  title: 'Um passeio inesquecível',
  description: 'Descobrimos as flores do jardim juntos. Uma tarde cheia de pequenas descobertas.',
  achievedAt: '2026-09-01',
  category: 'SOCIAL' as const,
  photoUrl: null,
  createdAt: '2026-09-01',
}
const meta = {
  title: 'Milestones/Timeline',
  component: MilestoneCard,
  args: { milestone: memory, onEdit: fn() },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MilestoneCard>
export default meta
type Story = StoryObj<typeof meta>
export const WithoutPhoto: Story = {}
export const WithPhoto: Story = {
  args: {
    milestone: {
      ...memory,
      photoUrl:
        'data:image/svg+xml,' +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#ded9c3"/><circle cx="350" cy="120" r="55" fill="#fbbf24"/><path d="M0 400V260Q180 130 300 270T600 220V400Z" fill="#527f66"/></svg>',
        ),
    },
  },
}
export const Dark: Story = { ...WithPhoto, globals: { theme: 'dark' } }
export const Months: Story = {
  render: () => (
    <MilestoneTimeline
      babies={[]}
      items={[
        memory,
        { ...memory, id: 'second', title: 'Uma nova descoberta', achievedAt: '2026-08-05' },
      ]}
    />
  ),
}
