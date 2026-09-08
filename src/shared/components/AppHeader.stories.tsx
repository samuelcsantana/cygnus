import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { buildBaby } from '@/test/fixtures/baby'
import { AppHeader } from './AppHeader'
import { ThemeContext } from '@/app/providers/theme-context'
const baby = buildBaby({ name: 'Maria Fernanda', avatarColor: '#6950C7' })
const meta = {
  title: 'Shared/AppHeader',
  component: AppHeader,
  decorators: [
    (Story) => (
      <ThemeContext.Provider
        value={{ theme: 'system', resolvedTheme: 'light', setTheme: () => {} }}
      >
        <Story />
      </ThemeContext.Provider>
    ),
  ],
  parameters: { layout: 'fullscreen' },
  args: {
    babies: [baby],
    selectedBabyId: baby.id,
    onSelectBaby: fn(),
    menuOpen: false,
    onOpenMenu: fn(),
    onSearch: fn(),
    unreadCount: 12,
    accountName: 'Samuel Santana',
    accountEmail: 'samuel@example.com',
    onLogout: fn(),
  },
} satisfies Meta<typeof AppHeader>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Dark: Story = { globals: { theme: 'dark' } }
export const Empty: Story = { args: { babies: [], selectedBabyId: null } }
