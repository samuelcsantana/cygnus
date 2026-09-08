import type { Meta, StoryObj } from '@storybook/react-vite'
import { buildBaby } from '@/test/fixtures/baby'
import { SpecialistCard } from './SpecialistCard'
const baby = buildBaby({ name: 'Maria Fernanda', avatarColor: '#6950C7' })
const meta = {
  title: 'Specialists/SpecialistCard',
  component: SpecialistCard,
  args: {
    specialist: {
      id: '1',
      userId: '1',
      name: 'Dra. Ana Carolina de Albuquerque',
      specialty: 'Pediatria e acompanhamento do desenvolvimento',
      phone: '(11) 99999-1234',
      babyIds: [baby.id],
      sharedWithUserIds: [],
      createdAt: '2026-01-01',
    },
    babies: [baby],
    accessKnown: true,
    isOwner: true,
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SpecialistCard>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Shared: Story = { args: { isOwner: false } }
export const Dark: Story = { ...Shared, globals: { theme: 'dark' } }
export const Unavailable: Story = { args: { linksError: true, babies: [] } }
