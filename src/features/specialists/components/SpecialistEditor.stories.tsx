import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { buildBaby } from '@/test/fixtures/baby'
import { SpecialistEditor } from './SpecialistEditor'

const baby = buildBaby({ name: 'Alice', avatarColor: '#6950C7' })
const meta = {
  title: 'Features/Specialists/Contact editor',
  component: SpecialistEditor,
  parameters: { layout: 'fullscreen' },
  args: {
    babies: [baby],
    guardians: [
      {
        userId: '99999999-9999-4999-8999-999999999999',
        name: 'Marina',
        email: 'marina@example.com',
      },
    ],
    specialties: ['Pediatria'],
    retryBabies: fn(),
    retryGuardians: fn(),
    retrySpecialties: fn(),
    onSave: fn().mockResolvedValue(undefined),
    onOpenChange: fn(),
  },
} satisfies Meta<typeof SpecialistEditor>
export default meta
type Story = StoryObj<typeof meta>
export const Create: Story = {}
export const Edit: Story = {
  args: {
    specialist: {
      id: baby.id,
      userId: baby.id,
      name: 'Dra. Ana Silva',
      specialty: 'Pediatria',
      phone: '(11) 99999-1234',
      babyIds: [baby.id],
      sharedWithUserIds: [],
      createdAt: '2026-01-01T00:00:00Z',
    },
  },
}
export const Dark: Story = { ...Edit, globals: { theme: 'dark' } }
export const Unavailable: Story = {
  args: {
    babies: [],
    guardians: [],
    babiesError: true,
    guardiansError: true,
    specialtiesError: true,
  },
}
export const Sharing: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const dialog = body.getByRole('dialog')
    const height = dialog.offsetHeight
    await userEvent.type(body.getByLabelText('Nome'), 'Dra. Ana Silva')
    await userEvent.click(body.getByRole('checkbox', { name: 'Alice' }))
    await expect(
      body.getByText('Você e todos os responsáveis das crianças selecionadas.'),
    ).toBeVisible()
    await expect(dialog.offsetHeight).toBe(height)
  },
}
