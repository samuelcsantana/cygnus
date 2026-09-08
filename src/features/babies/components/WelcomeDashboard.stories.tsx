import type { Meta, StoryObj } from '@storybook/react-vite'
import { WelcomeDashboard } from './WelcomeDashboard'
const meta = {
  title: 'Babies/WelcomeDashboard',
  component: WelcomeDashboard,
  args: { greetingKey: 'babies.dashboard.greetingMorning' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof WelcomeDashboard>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Dark: Story = { globals: { theme: 'dark' } }
