import { ThemeContext } from '@/app/providers/theme-context'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { waitFor, expect, userEvent, within } from 'storybook/test'
import { ProfileRoute } from './ProfileRoute'
function Example() {
  const [client] = useState(() => {
    const cache = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    })
    cache.setQueryData(['auth', 'me'], {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Fernanda Oliveira',
      email: 'fernanda@example.com',
      avatarUrl: null,
      createdAt: '2026-01-01',
    })
    return cache
  })
  return (
    <QueryClientProvider client={client}>
      <ThemeContext.Provider
        value={{ theme: 'system', resolvedTheme: 'light', setTheme: () => {} }}
      >
        <ProfileRoute />
      </ThemeContext.Provider>
    </QueryClientProvider>
  )
}
const meta = { title: 'Profile/Page', component: Example } satisfies Meta<typeof Example>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Dark: Story = { globals: { theme: 'dark' } }
export const Password: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Trocar senha' }))
    await waitFor(() => expect(canvas.getByLabelText('Senha atual')).toBeVisible())
  },
}
