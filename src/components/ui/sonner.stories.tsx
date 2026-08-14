import type { Meta, StoryObj } from '@storybook/react-vite'
import { toast } from 'sonner'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { KNOWN_CONTRAST_DEBT } from '@/test/a11y-known-issues'

import { Button } from './button'
import { Toaster } from './sonner'

const meta = {
  title: 'UI/Toast',
  component: Toaster,
  parameters: {
    docs: {
      description: {
        component:
          'Confirmation feedback for the central actions. Added after a usability review found ' +
          'that applying a vaccine, rescheduling an appointment or saving a milestone all ' +
          'succeeded silently — the dialog closed and nothing told the user it had worked. ' +
          'A single `<Toaster />` is mounted by `AppProviders`; features only call `toast()`.',
      },
    },
    // The Toaster itself renders nothing until a toast is fired, so an empty
    // Controls table here would be misleading.
    controls: { disable: true },
    // The trigger row includes the destructive button, whose token pair is
    // below AA — see src/test/a11y-known-issues.ts.
    ...KNOWN_CONTRAST_DEBT,
  },
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => toast.success('Vacina registrada com sucesso.')}>Sucesso</Button>
      <Button variant="outline" onClick={() => toast('Consulta remarcada para 25 de março.')}>
        Neutro
      </Button>
      <Button variant="destructive" onClick={() => toast.error('Não foi possível salvar o marco.')}>
        Erro
      </Button>
    </div>
  ),
}

export const FiringAToast: Story = {
  name: 'Interaction — success toast appears',
  render: Variants.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const screen = within(document.body)

    await userEvent.click(canvas.getByRole('button', { name: 'Sucesso' }))

    await waitFor(() => expect(screen.getByText('Vacina registrada com sucesso.')).toBeVisible())
  },
}
