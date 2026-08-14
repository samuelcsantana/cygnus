import type { Meta, StoryObj } from '@storybook/react-vite'

import { AlertCircleIcon } from '@/shared/icons/alert-circle-icon'
import { CheckIcon } from '@/shared/icons/check-icon'
import { ClockIcon } from '@/shared/icons/clock-icon'
import { KNOWN_CONTRAST_DEBT } from '@/test/a11y-known-issues'

import { Badge } from './badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    docs: {
      description: {
        component:
          'Compact status marker. Used mostly for vaccine and appointment state, where the rule ' +
          'from the accessibility pass applies: state is never carried by color alone — every ' +
          'badge pairs its color with a label, and usually an icon.',
      },
    },
  },
  args: { children: 'Aplicada' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'],
    },
    asChild: { table: { disable: true } },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  // Includes the destructive variant — see src/test/a11y-known-issues.ts.
  parameters: { ...KNOWN_CONTRAST_DEBT },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge {...args} variant="default">
        Default
      </Badge>
      <Badge {...args} variant="secondary">
        Secondary
      </Badge>
      <Badge {...args} variant="destructive">
        Destructive
      </Badge>
      <Badge {...args} variant="outline">
        Outline
      </Badge>
      <Badge {...args} variant="ghost">
        Ghost
      </Badge>
    </div>
  ),
}

export const VaccineStatus: Story = {
  name: 'Vaccine status (color + icon + label)',
  parameters: {
    docs: {
      description: {
        story:
          'The three states a vaccine can be in. A parent scanning this list under stress should ' +
          'not have to distinguish teal from amber to know what is overdue — the icon and the ' +
          'word carry the same information the color does.',
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge className="bg-teal-50 text-teal-700">
        <CheckIcon />
        Aplicada
      </Badge>
      <Badge className="bg-amber-50 text-amber-700">
        <ClockIcon />
        Pendente
      </Badge>
      <Badge className="bg-rose-50 text-rose-700">
        <AlertCircleIcon />
        Atrasada
      </Badge>
    </div>
  ),
}
