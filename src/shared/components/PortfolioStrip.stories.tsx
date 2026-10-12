import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { PortfolioStrip } from './PortfolioStrip'

const meta = {
  title: 'Shared/PortfolioStrip',
  component: PortfolioStrip,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The band above the public screens that says this is a portfolio project and links to the code and ' +
          'the design system. Dark green in both themes, so it reads as a frame around the product rather than ' +
          'part of it.',
      },
    },
  },
} satisfies Meta<typeof PortfolioStrip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const strip = within(canvasElement).getByRole('complementary', { name: 'Sobre este projeto' })
    // Both open in a new tab, and say so to a screen reader rather than surprising it.
    for (const link of within(strip).getAllByRole('link')) {
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      await expect(link).toHaveAccessibleName(expect.stringContaining('(abre em nova aba)'))
    }
  },
}
