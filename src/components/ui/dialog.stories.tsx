import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Button } from './button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'
import { Input } from './input'
import { Label } from './label'

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  parameters: {
    docs: {
      description: {
        component:
          'Every create/edit flow in the app is a dialog. Focus trapping, focus restore, `Esc` to ' +
          'close and the `aria-labelledby`/`aria-describedby` wiring come from Radix — that is ' +
          'precisely why shadcn/Radix was chosen over hand-rolled primitives (AGENTS.md §3). ' +
          'The one thing added on top is `max-h-[85vh] overflow-y-auto`, after the accessibility ' +
          'pass found long forms overflowing the viewport with no way to scroll on mobile.',
      },
    },
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button>Adicionar bebê</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar bebê</DialogTitle>
          <DialogDescription>
            Preencha os dados da criança. Você pode convidar outro responsável depois.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="dialog-baby-name">Nome</Label>
            <Input id="dialog-baby-name" placeholder="Helena" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dialog-baby-birth">Data de nascimento</Label>
            <Input id="dialog-baby-birth" type="date" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const OpenAndClose: Story = {
  name: 'Interaction — open, focus trap and Esc',
  render: Default.render,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    // Radix portals the content outside canvasElement, so assertions on the open
    // dialog query the document body rather than the story canvas.
    const screen = within(document.body)

    await step('opens from the trigger', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Adicionar bebê' }))
      await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible())
    })

    await step('exposes an accessible name and description', async () => {
      const dialog = screen.getByRole('dialog')
      await expect(dialog).toHaveAccessibleName('Adicionar bebê')
      await expect(dialog).toHaveAccessibleDescription(
        'Preencha os dados da criança. Você pode convidar outro responsável depois.',
      )
    })

    await step('moves focus inside the dialog', async () => {
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement | null),
      )
    })

    await step('closes on Esc', async () => {
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })
  },
}
