import { userEvent, within, expect } from 'storybook/test'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { buildBaby } from '@/test/fixtures/baby'
import { VaccinationCardDocument, type VaccinationCardRow } from './VaccinationCardDocument'
const record: VaccinationCardRow = {
  key: '1',
  date: '2026-08-20',
  name: 'Tríplice viral',
  dose: '1ª dose',
  status: 'APPLIED',
  source: 'CATALOG',
  batchNumber: 'AB-123',
  location: 'UBS Jardim das Flores',
  professional: 'Enf. Maria',
  notes: 'Registro da família.',
  photoUrl: null,
}
const meta = {
  title: 'Vaccines/VaccinationCardDocument',
  component: VaccinationCardDocument,
  args: {
    baby: buildBaby({ name: 'Maria Fernanda de Albuquerque', avatarColor: '#6950C7' }),
    applied: [record],
    upcoming: [
      {
        ...record,
        key: '2',
        date: null,
        status: 'PENDING',
        name: 'Hepatite A',
        batchNumber: null,
        location: null,
        professional: null,
        notes: null,
      },
    ],
    includeCalendar: false,
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof VaccinationCardDocument>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Dark: Story = { globals: { theme: 'dark' } }
export const Empty: Story = { args: { applied: [], upcoming: [] } }

export const Details: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('Detalhes do registro'))
    await expect(canvas.getAllByText('AB-123')[0]).toBeVisible()
  },
}
