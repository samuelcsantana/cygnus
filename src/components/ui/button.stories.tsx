import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'

import { PlusIcon } from '@/shared/icons/plus-icon'
import { TrashIcon } from '@/shared/icons/trash-icon'
import { KNOWN_CONTRAST_DEBT } from '@/test/a11y-known-issues'

import { Button } from './button'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'The single action primitive of the app. Built on `class-variance-authority`, so every ' +
          'visual state is a declared variant rather than a per-call-site `className` override. ' +
          '`asChild` renders the styling onto a child element (a router `Link`, typically) instead ' +
          'of a `<button>`, which keeps link semantics intact.',
      },
    },
  },
  args: {
    children: 'Salvar',
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg', 'icon-touch'],
    },
    disabled: { control: 'boolean' },
    asChild: { table: { disable: true } },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`destructive` is deliberately a tinted surface rather than a solid red fill — the ' +
          'destructive actions in this app (deleting a milestone, removing a guardian) are always ' +
          'behind a confirmation dialog, so the button itself does not need to shout. That tint is ' +
          'also the one pair here below AA: see `src/test/a11y-known-issues.ts`.',
      },
    },
    ...KNOWN_CONTRAST_DEBT,
  },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="default">
        Default
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="destructive">
        Destructive
      </Button>
      <Button {...args} variant="link">
        Link
      </Button>
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} size="xs">
        Extra small
      </Button>
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="default">
        Default
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
}

export const WithIcon: Story = {
  // Includes the destructive variant — see src/test/a11y-known-issues.ts.
  parameters: { ...KNOWN_CONTRAST_DEBT },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args}>
        <PlusIcon />
        Adicionar consulta
      </Button>
      <Button {...args} variant="destructive">
        <TrashIcon />
        Excluir marco
      </Button>
    </div>
  ),
}

export const IconOnly: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'An icon-only button carries no accessible name from its content, so `aria-label` is ' +
          'mandatory here — the a11y check on this story fails without it.',
      },
    },
  },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} size="icon-sm" aria-label="Adicionar bebê">
        <PlusIcon />
      </Button>
      <Button {...args} size="icon" aria-label="Adicionar bebê">
        <PlusIcon />
      </Button>
      <Button {...args} size="icon-lg" aria-label="Adicionar bebê">
        <PlusIcon />
      </Button>
    </div>
  ),
}

export const TouchTarget: Story = {
  name: 'Touch target (44×44)',
  parameters: {
    docs: {
      description: {
        story:
          'The `icon-touch` size exists for icon-only primary actions inside dense mobile lists, ' +
          'where `icon`/`icon-sm` look right but fall below the WCAG 2.5.5 minimum hit area. ' +
          'This app is used mostly one-handed on a phone, so the 44×44 floor is not optional.',
      },
    },
  },
  render: (args) => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Button {...args} size="icon-sm" aria-label="Editar marco">
          <PlusIcon />
        </Button>
        <span className="text-ink-muted text-xs">icon-sm — 28px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button {...args} size="icon-touch" aria-label="Editar marco">
          <PlusIcon />
        </Button>
        <span className="text-ink-muted text-xs">icon-touch — 44px</span>
      </div>
    </div>
  ),
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const Submitting: Story = {
  name: 'Submitting (pending mutation)',
  parameters: {
    docs: {
      description: {
        story:
          'There is no `loading` prop: forms in this app disable the submit button off the ' +
          "TanStack Query mutation's `isPending` flag. The pattern is documented here so it stays " +
          'consistent instead of being reinvented per dialog.',
      },
    },
  },
  args: {
    disabled: true,
    children: 'Salvando…',
  },
}

export const AsChildLink: Story = {
  name: 'As a link (asChild)',
  args: { asChild: true },
  render: (args) => (
    <Button {...args}>
      <a href="#vaccines">Ver calendário de vacinas</a>
    </Button>
  ),
}

export const ClickInteraction: Story = {
  name: 'Interaction — click and disabled state',
  args: { children: 'Confirmar' },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Confirmar' })

    await step('fires onClick when enabled', async () => {
      await userEvent.click(button)
      await expect(args.onClick).toHaveBeenCalledTimes(1)
    })

    await step('is reachable and activatable by keyboard', async () => {
      button.focus()
      await expect(button).toHaveFocus()
      await userEvent.keyboard('{Enter}')
      await expect(args.onClick).toHaveBeenCalledTimes(2)
    })
  },
}

export const DisabledInteraction: Story = {
  name: 'Interaction — disabled swallows clicks',
  args: { children: 'Confirmar', disabled: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Confirmar' })

    await expect(button).toBeDisabled()
    // `pointer-events-none` on the disabled variant means userEvent would throw
    // rather than click, so the assertion is on the handler, not on the gesture.
    await userEvent.click(button, { pointerEventsCheck: 0 })
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}
