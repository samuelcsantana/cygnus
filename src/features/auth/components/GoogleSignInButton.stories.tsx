import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { GoogleSignInButton } from './GoogleSignInButton'
import { googleAuthQueryKeys } from '../api/google-auth.hooks'

function Example({ enabled }: { enabled: boolean }) {
  const [client] = useState(() => {
    const cache = new QueryClient()
    cache.setQueryData(googleAuthQueryKeys.status, { enabled })
    return cache
  })
  return <QueryClientProvider client={client}><div className="max-w-sm p-4"><GoogleSignInButton /></div></QueryClientProvider>
}
const meta = { title: 'Auth/Google sign-in', component: Example, args: { enabled: true } } satisfies Meta<typeof Example>
export default meta
type Story = StoryObj<typeof meta>
export const Available: Story = {
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: /Google/ })
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await expect(button).toBeEnabled()
  },
}
export const Dark: Story = { globals: { theme: 'dark' } }
export const Unavailable: Story = { args: { enabled: false } }
