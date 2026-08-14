import type { Meta, StoryObj } from '@storybook/react-vite'

import type { Step } from './StepIndicator'
import { StepIndicator } from './StepIndicator'

const STEPS: Step[] = [
  { id: 'baby', label: 'Criança' },
  { id: 'vaccine', label: 'Vacina' },
  { id: 'details', label: 'Detalhes' },
]

const meta = {
  title: 'Shared/StepIndicator',
  component: StepIndicator,
  parameters: {
    docs: {
      description: {
        component:
          'Progress marker for the multi-step creation dialogs. The accent color is passed in ' +
          'rather than fixed, so each feature keeps its own section color (teal for vaccines, ' +
          'violet for appointments, amber for milestones).',
      },
    },
  },
  args: { steps: STEPS },
  argTypes: {
    currentStepId: { control: 'inline-radio', options: STEPS.map((step) => step.id) },
  },
} satisfies Meta<typeof StepIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const FirstStep: Story = {
  args: { currentStepId: 'baby' },
}

export const MiddleStep: Story = {
  args: { currentStepId: 'vaccine' },
}

export const LastStep: Story = {
  args: { currentStepId: 'details' },
}

export const PerFeatureAccent: Story = {
  name: 'Per-feature accent color',
  args: { currentStepId: 'vaccine' },
  render: (args) => (
    <div className="space-y-6">
      <StepIndicator {...args} accentClassName="bg-teal-500" />
      <StepIndicator {...args} accentClassName="bg-violet-500" />
      <StepIndicator {...args} accentClassName="bg-amber-500" />
    </div>
  ),
}
