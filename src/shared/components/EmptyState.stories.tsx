import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '@/components/ui/button'
import { CalendarIcon } from '@/shared/icons/calendar-icon'
import { HeartIcon } from '@/shared/icons/heart-icon'
import { PlusIcon } from '@/shared/icons/plus-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'

import { EmptyState } from './EmptyState'

const meta = {
  title: 'Shared/EmptyState',
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component:
          'The "no data yet" state, tinted to match whichever section it appears in. It is a ' +
          'distinct component from `NoSearchResults` on purpose: "you have no appointments" and ' +
          '"your search matched no appointments" are different situations and need different ' +
          'wording and a different way out.',
      },
    },
  },
  argTypes: {
    tone: { control: 'inline-radio', options: ['slate', 'teal', 'violet', 'amber', 'rose'] },
    icon: { table: { disable: true } },
    action: { table: { disable: true } },
  },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Vaccines: Story = {
  args: {
    tone: 'teal',
    icon: <SyringeIcon className="h-10 w-10" />,
    title: 'Nenhuma vacina registrada',
    description:
      'Assim que você adicionar um bebê, o calendário oficial de vacinas aparece aqui automaticamente.',
    action: (
      <Button>
        <PlusIcon />
        Adicionar bebê
      </Button>
    ),
  },
}

export const Appointments: Story = {
  args: {
    tone: 'violet',
    icon: <CalendarIcon className="h-10 w-10" />,
    title: 'Nenhuma consulta agendada',
    description: 'Registre a próxima ida ao pediatra para receber um lembrete quando ela se aproximar.',
    action: (
      <Button>
        <PlusIcon />
        Agendar consulta
      </Button>
    ),
  },
}

export const Milestones: Story = {
  args: {
    tone: 'amber',
    icon: <HeartIcon className="h-10 w-10" />,
    title: 'A linha do tempo está vazia',
    description: 'Primeiro sorriso, primeiros passos, primeira palavra — registre para não esquecer.',
  },
}

export const WithoutAction: Story = {
  name: 'Without an action',
  args: {
    icon: <SyringeIcon className="h-10 w-10" />,
    title: 'Nada por aqui',
    description: 'Um estado vazio sem saída deve ser raro — se o usuário não pode fazer nada, diga o porquê.',
  },
}
