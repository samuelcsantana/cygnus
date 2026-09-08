import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { NotificationsPanel } from './NotificationsPanel'
import type { Notification } from '../api/notifications.schemas'
const initial: Notification[] = [
  {
    id: 'one',
    babyId: 'ana',
    type: 'VACCINE_DELAYED',
    referenceId: 'vaccine',
    title: 'Vacina atrasada: BCG',
    message: 'A vacina BCG de Ana está atrasada.',
    createdAt: '2026-09-08T12:00:00Z',
    readAt: null,
  },
  {
    id: 'two',
    babyId: 'ana',
    type: 'APPOINTMENT_UPCOMING',
    referenceId: 'appointment',
    title: 'Consulta com Dra. Helena',
    message: 'Ana tem consulta em 2026-09-10T15:00:00.000Z.',
    createdAt: '2026-09-08T12:00:00Z',
    readAt: '2026-09-08T13:00:00Z',
  },
]
function Example({ pending = false, empty = false }: { pending?: boolean; empty?: boolean }) {
  const [items, setItems] = useState(empty ? [] : initial)
  return (
    <NotificationsPanel
      notifications={items}
      babies={[{ id: 'ana', name: 'Ana' }]}
      compact={false}
      pending={pending}
      onOpen={() => {}}
      onMarkRead={(id) =>
        setItems((previous) =>
          previous.map((item) =>
            item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
          ),
        )
      }
    />
  )
}
const meta = {
  title: 'Notifications/Panel',
  component: Example,
} satisfies Meta<typeof Example>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Dark: Story = { globals: { theme: 'dark' } }
export const Pending: Story = { args: { pending: true } }
export const Empty: Story = { args: { empty: true } }
export const MarkRead: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Marcar como lida' }))
    await expect(canvas.queryByRole('button', { name: 'Marcar como lida' })).not.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Ver vacina' })).toBeVisible()
  },
}
