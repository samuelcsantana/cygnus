import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, userEvent, within, expect } from 'storybook/test'
import { buildBaby } from '@/test/fixtures/baby'
import { FamilyContext } from './FamilyContext'
const alice = buildBaby({ name: 'Alice', avatarColor: '#6950C7' })
const meta = {
  title: 'Shared/FamilyContext',
  component: FamilyContext,
  decorators: [
    (Story) => (
      <div className="w-60">
        <Story />
      </div>
    ),
  ],
  args: {
    babies: [
      alice,
      buildBaby({
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Maria Fernanda de Albuquerque',
      }),
    ],
    selectedBabyId: alice.id,
    onSelectBaby: fn(),
  },
} satisfies Meta<typeof FamilyContext>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Open: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button'))
    await expect(within(document.body).getByRole('menuitemradio', { name: 'Alice' })).toBeChecked()
  },
}
export const Dark: Story = { ...Open, globals: { theme: 'dark' } }
export const Empty: Story = {
  ...Open,
  args: { babies: [], selectedBabyId: null },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button'))
  },
}
export const Loading: Story = { args: { loading: true } }
export const Error: Story = { ...Empty, args: { babies: [], error: true, onRetry: fn() } }
