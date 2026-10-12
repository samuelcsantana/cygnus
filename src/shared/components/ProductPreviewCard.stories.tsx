import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { ProductPreviewCard } from './ProductPreviewCard'

const meta = {
  title: 'Shared/ProductPreviewCard',
  component: ProductPreviewCard,
  parameters: {
    docs: {
      description: {
        component:
          'A still of the vaccine card for the public screens, showing the same family the demo account opens on. ' +
          'One image to assistive technology, with a description, so a picture of the product is never read out ' +
          'as if it were someone’s records.',
      },
    },
  },
} satisfies Meta<typeof ProductPreviewCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const image = within(canvasElement).getByRole('img', { name: /Prévia do app/ })
    await expect(image).toBeVisible()
  },
}
