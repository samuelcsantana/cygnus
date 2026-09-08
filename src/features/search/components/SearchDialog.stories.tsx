import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { buildBaby } from '@/test/fixtures/baby'
import { buildAppointment } from '@/test/fixtures/appointment'
import { SearchDialog } from './SearchDialog'

function Example() {
  const [open, setOpen] = useState(true)
  const [client] = useState(() => {
    const cache = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    })
    const baby = buildBaby({ id: '11111111-1111-4111-8111-111111111111', name: 'Alice' })
    cache.setQueryData(['babies'], [baby])
    cache.setQueryData(['specialists'], [])
    cache.setQueryData(['babies', baby.id, 'vaccines'], { groups: [], metadata: null })
    cache.setQueryData(['babies', baby.id, 'vaccines', 'adhoc'], [])
    cache.setQueryData(
      ['babies', baby.id, 'appointments'],
      [
        buildAppointment({
          babyId: baby.id,
          doctorName: 'Dra. Fernanda Lima',
          specialty: 'Pediatria',
          scheduledAt: '2026-09-15T15:00:00Z',
        }),
      ],
    )
    cache.setQueryData(['babies', baby.id, 'medications'], [])
    cache.setQueryData(['babies', baby.id, 'milestones'], [])
    return cache
  })
  return (
    <QueryClientProvider client={client}>
      <button type="button" onClick={() => setOpen(true)}>
        Buscar
      </button>
      <SearchDialog open={open} onOpenChange={setOpen} />
    </QueryClientProvider>
  )
}
const meta = { title: 'Search/Dialog', component: Example } satisfies Meta<typeof Example>
export default meta
type Story = StoryObj<typeof meta>
export const Initial: Story = {}
export const Results: Story = {
  play: async () => {
    const body = within(document.body)
    const input = await body.findByRole('searchbox')
    await userEvent.type(input, 'fernanda')
    const link = await body.findByRole('link', { name: /Fernanda/ })
    await userEvent.keyboard('{ArrowDown}')
    await expect(link).toHaveFocus()
  },
}
export const Empty: Story = {
  play: async () => {
    const body = within(document.body)
    await userEvent.type(await body.findByRole('searchbox'), 'inexistente')
    await expect(await body.findByText(/Nada encontrado/)).toBeVisible()
  },
}
export const Dark: Story = { ...Results, globals: { theme: 'dark' } }
