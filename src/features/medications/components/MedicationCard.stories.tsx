import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { todayDateString } from '@/lib/date'
import { MedicationCard } from './MedicationCard'
const meta = {
  title: 'Medications/MedicationCard',
  component: MedicationCard,
  args: {
    medication: {
      id: '1',
      babyId: '1',
      name: 'Medicamento registrado',
      dosage: 'Conforme receita',
      frequency: 'Conforme receita',
      startedOn: '2020-01-01',
      endedOn: '2099-12-31',
      reason: 'Registro da família',
      prescriberName: 'Dra. Ana Silva',
      notes: 'Observações do registro.',
      createdAt: '2020-01-01',
    },
    onEdit: fn(),
    onEnd: fn(),
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MedicationCard>
export default meta
type Story = StoryObj<typeof meta>
export const Active: Story = {}
export const Planned: Story = {
  args: { medication: { ...meta.args.medication, startedOn: '2099-01-01' } },
}
export const EndsToday: Story = {
  args: { medication: { ...meta.args.medication, endedOn: todayDateString() } },
}
export const Ended: Story = {
  args: { medication: { ...meta.args.medication, endedOn: '2020-01-02' } },
}
export const Dark: Story = { ...Active, globals: { theme: 'dark' } }
