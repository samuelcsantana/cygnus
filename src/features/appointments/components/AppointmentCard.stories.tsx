import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { buildAppointment } from '@/test/fixtures/appointment'
import { buildBaby } from '@/test/fixtures/baby'
import { AppointmentCard } from './AppointmentCard'
const meta = {
  title: 'Appointments/AppointmentCard',
  component: AppointmentCard,
  args: {
    appointment: buildAppointment({
      scheduledAt: '2099-01-15T13:00:00Z',
      location: 'Clínica Jardim das Flores',
      reason: 'Acompanhamento',
      notes: 'Levar os registros anteriores.',
    }),
    baby: buildBaby({ name: 'Maria Fernanda' }),
    onReschedule: fn(),
    onViewDetails: fn(),
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof AppointmentCard>
export default meta
type Story = StoryObj<typeof meta>
export const Next: Story = { args: { featured: true } }
export const Review: Story = {
  args: { appointment: buildAppointment({ scheduledAt: '2020-01-01T10:00:00Z' }) },
}
export const Completed: Story = {
  args: {
    appointment: buildAppointment({
      status: 'COMPLETED',
      weightGrams: 12300,
      heightMillimeters: 860,
    }),
  },
}
export const Cancelled: Story = { args: { appointment: buildAppointment({ status: 'CANCELLED' }) } }
export const Dark: Story = { ...Next, globals: { theme: 'dark' } }
