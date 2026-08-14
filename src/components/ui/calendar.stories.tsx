import type { Meta, StoryObj } from '@storybook/react-vite'
import { ptBR } from 'date-fns/locale'
import { useState } from 'react'

import { Calendar } from './calendar'

// Pinned so the story renders the same month on every visit — a calendar that
// silently follows "today" makes visual review and screenshots meaningless.
const REFERENCE_MONTH = new Date(2026, 2, 1)
const REFERENCE_DAY = new Date(2026, 2, 18)

const meta = {
  title: 'UI/Calendar',
  component: Calendar,
  parameters: {
    docs: {
      description: {
        component:
          'Date picker built on `react-day-picker`. It is mounted inside a `Popover` by the shared ' +
          '`DatePickerField`, which is what forms actually use — a raw `Calendar` is rarely placed ' +
          'directly on a screen.',
      },
    },
  },
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { defaultMonth: REFERENCE_MONTH, locale: ptBR },
  render: function Render(args) {
    const [selected, setSelected] = useState<Date | undefined>(REFERENCE_DAY)
    return <Calendar {...args} mode="single" selected={selected} onSelect={setSelected} className="rounded-xl border" />
  },
}

export const WithDropdownNavigation: Story = {
  name: 'Dropdown navigation (birth dates)',
  parameters: {
    docs: {
      description: {
        story:
          'A birth date can be years back, and paging month by month is painful on a phone. ' +
          '`captionLayout="dropdown"` lets the month and year be jumped to directly.',
      },
    },
  },
  args: {
    defaultMonth: REFERENCE_MONTH,
    locale: ptBR,
    captionLayout: 'dropdown',
    startMonth: new Date(2015, 0),
    endMonth: REFERENCE_MONTH,
  },
  render: Default.render,
}

export const FutureDatesDisabled: Story = {
  name: 'Future dates disabled',
  parameters: {
    docs: {
      description: {
        story:
          'A birth date in the future is rejected by the Zod schema anyway; disabling it in the ' +
          'calendar means the user never gets to make the mistake in the first place.',
      },
    },
  },
  args: {
    defaultMonth: REFERENCE_MONTH,
    locale: ptBR,
    disabled: { after: REFERENCE_DAY },
  },
  render: Default.render,
}
