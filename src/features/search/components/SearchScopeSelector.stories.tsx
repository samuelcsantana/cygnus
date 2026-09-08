import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within, waitFor } from 'storybook/test'
import { buildBaby } from '@/test/fixtures/baby'
import { SearchScopeSelector } from './SearchScopeSelector'
const meta = {
  title: 'Search/ScopeSelector',
  component: SearchScopeSelector,
  args: {
    babies: [
      buildBaby({ id: '11111111-1111-4111-8111-111111111111', name: 'Alice' }),
      buildBaby({ id: '22222222-2222-4222-8222-222222222222', name: 'Bruno Henrique de Oliveira' }),
    ],
    value: null,
    onChange: fn(),
    onRetry: fn(),
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value)
    return <SearchScopeSelector {...args} value={value} onChange={setValue} />
  },
} satisfies Meta<typeof SearchScopeSelector>
export default meta
type Story = StoryObj<typeof meta>
const open = async () => {
  const body = within(document.body)
  await userEvent.click(body.getByRole('button', { name: /Buscar em:/ }))
}
export const Family: Story = { play: open }
export const Child: Story = { args: { value: '11111111-1111-4111-8111-111111111111' }, play: open }
export const Dark: Story = { ...Child, globals: { theme: 'dark' } }
export const Loading: Story = { args: { loading: true }, play: open }
export const Error: Story = { args: { error: true }, play: open }
export const NoChildren: Story = {
  args: { babies: [] },
  play: async () => {
    await open()
    await waitFor(() =>
      expect(
        within(document.body).getByRole('menuitemradio', { name: 'Toda a família' }),
      ).toBeVisible(),
    )
  },
}
