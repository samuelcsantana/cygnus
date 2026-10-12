import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { ServerWakingNotice } from './ServerWakingNotice'

const meta = {
  title: 'Shared/ServerWakingNotice',
  component: ServerWakingNotice,
  parameters: {
    docs: {
      description: {
        component:
          'Shown under an auth form’s button once its request has run 1.5s: the API is on a free plan that ' +
          'sleeps, and a minute of "Entrando..." with no reason given reads as broken.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ServerWakingNotice>

export default meta
type Story = StoryObj<typeof meta>

export const Waking: Story = {
  args: { active: true },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText('Acordando o servidor', {}, { timeout: 3000 })).toBeVisible()
  },
}
