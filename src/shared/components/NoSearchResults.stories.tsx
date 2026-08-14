import type { Meta, StoryObj } from '@storybook/react-vite'

import { NoSearchResults } from './NoSearchResults'

const meta = {
  title: 'Shared/NoSearchResults',
  component: NoSearchResults,
  parameters: {
    docs: {
      description: {
        component:
          'Shown when a list has data but the active search term matches none of it. Kept separate ' +
          'from `EmptyState` because telling a parent with 18 registered vaccines that they have ' +
          '"no vaccines" would be plainly wrong. Its text comes from i18n — switch the locale in ' +
          'the toolbar to see it in English or Spanish.',
      },
    },
  },
} satisfies Meta<typeof NoSearchResults>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
