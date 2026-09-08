import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { buildBaby } from '@/test/fixtures/baby'
import { BabyEditorDialog } from './BabyEditorDialog'

const meta = {
  title: 'Features/Babies/Profile editor', component: BabyEditorDialog,
  parameters: { layout: 'fullscreen' },
  args: { open: true, onOpenChange: fn(), onSave: fn() },
} satisfies Meta<typeof BabyEditorDialog>
export default meta
type Story = StoryObj<typeof meta>
export const Create: Story = {}
export const Edit: Story = { args: { baby: buildBaby({ name: 'Alice', avatarColor: '#6950C7' }) } }
export const Health: Story = {
  ...Edit,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const dialog = body.getByRole('dialog')
    const before = { height: dialog.offsetHeight, width: dialog.offsetWidth }
    await userEvent.click(body.getByRole('button', { name: /02.*Saúde/ }))
    await userEvent.click(body.getByRole('button', { name: 'Registrar nova medida' }))
    await expect(body.getByLabelText('Peso (kg)')).toBeVisible()
    await expect(dialog.offsetHeight).toBe(before.height)
    await expect(dialog.offsetWidth).toBe(before.width)
    await userEvent.click(body.getByRole('button', { name: 'Cor 2' }))
    await expect(body.getByTestId('avatar-preview')).toHaveStyle({ backgroundColor: '#A95318' })
  },
}
