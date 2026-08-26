import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { TrashIcon } from '@/shared/icons/trash-icon'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog'
import { Button } from './button'

const meta = {
  title: 'UI/AlertDialog',
  component: AlertDialog,
  parameters: {
    docs: {
      description: {
        component:
          'The confirmation gate in front of every destructive action — deleting a milestone, ' +
          'removing an ad-hoc vaccine record, removing a guardian, deleting the account. Because ' +
          'the destruction is always gated here, the destructive `Button` variant itself can stay ' +
          'a tinted surface instead of a solid red alarm.',
      },
    },
  },
} satisfies Meta<typeof AlertDialog>

export default meta
type Story = StoryObj<typeof meta>

interface ConfirmProps {
  onConfirm: () => void
}

function DeleteMilestoneConfirm({ onConfirm }: ConfirmProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <TrashIcon />
          Excluir marco
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogMedia className="bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-300">
          <TrashIcon />
        </AlertDialogMedia>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “Primeiros passos”?</AlertDialogTitle>
          <AlertDialogDescription>
            O registro e a foto anexada serão removidos permanentemente. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const Default: Story = {
  render: () => <DeleteMilestoneConfirm onConfirm={fn()} />,
}

export const CancelKeepsData: Story = {
  name: 'Interaction — cancel does not destroy',
  parameters: {
    docs: {
      description: {
        story:
          'The assertion that actually matters on a destructive dialog: dismissing it must not ' +
          'fire the destructive handler. Confirming must fire it exactly once.',
      },
    },
  },
  render: function Render() {
    // The deletion count is rendered into the story rather than kept in a spy,
    // so the assertion below reads the same thing a human reviewing the story
    // sees on screen.
    const [deleteCount, setDeleteCount] = useState(0)

    return (
      <div className="flex flex-col items-start gap-4">
        <DeleteMilestoneConfirm onConfirm={() => setDeleteCount((count) => count + 1)} />
        <p className="text-ink-muted text-sm">
          Exclusões confirmadas: <span data-testid="delete-count">{deleteCount}</span>
        </p>
      </div>
    )
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const screen = within(document.body)
    const openDialog = async () => {
      await userEvent.click(canvas.getByRole('button', { name: /excluir marco/i }))
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeVisible())
    }

    await step('cancelling closes the dialog without deleting', async () => {
      await openDialog()
      await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
      await expect(canvas.getByTestId('delete-count')).toHaveTextContent('0')
    })

    await step('confirming deletes exactly once', async () => {
      await openDialog()
      await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
      await expect(canvas.getByTestId('delete-count')).toHaveTextContent('1')
    })
  },
}
