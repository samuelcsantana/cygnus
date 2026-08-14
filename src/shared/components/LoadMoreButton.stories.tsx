import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { LoadMoreButton } from './LoadMoreButton'

const meta = {
  title: 'Shared/LoadMoreButton',
  component: LoadMoreButton,
  parameters: {
    docs: {
      description: {
        component:
          'Client-side pagination for the long lists. An explicit "load more" was chosen over ' +
          'infinite scroll: these lists are records a parent scrolls back through looking for ' +
          'something specific, and infinite scroll makes the end of a list unreachable.',
      },
    },
  },
  args: { label: 'Carregar mais', onClick: fn() },
} satisfies Meta<typeof LoadMoreButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
