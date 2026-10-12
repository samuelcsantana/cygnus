import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'

import { DemoBanner } from './DemoBanner'

const meta = {
  title: 'Shared/DemoBanner',
  component: DemoBanner,
  args: { onCreateAccount: fn(), onExit: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Above every signed-in screen while the account is a demo: the data is made up and deleted in 24 ' +
          'hours, and the two ways out are a real account or leaving.',
      },
    },
  },
} satisfies Meta<typeof DemoBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const banner = within(canvasElement).getByRole('region', { name: 'Demonstração' })
    await userEvent.click(within(banner).getByRole('button', { name: 'Criar minha conta' }))
    await expect(args.onCreateAccount).toHaveBeenCalledTimes(1)
    await userEvent.click(within(banner).getByRole('button', { name: 'Sair' }))
    await expect(args.onExit).toHaveBeenCalledTimes(1)
  },
}

/** Both actions sign out first, so both wait while that request runs. */
export const SigningOut: Story = {
  args: { pending: true },
}
