import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { buildBaby } from '@/test/fixtures/baby'
import type { MilestoneFormInput } from '../api/milestones.schemas'
import { MilestoneCoreFields } from './MilestoneCoreFields'
import { MilestoneDialogLayout } from './MilestoneDialogLayout'

function Core() {
  const {
    register,
    control,
    formState: { errors },
  } = useForm<MilestoneFormInput>({
    defaultValues: { title: 'Primeiro sorriso', achievedAt: '2026-09-07', category: 'SOCIAL' },
  })
  return <MilestoneCoreFields register={register} control={control} errors={errors} />
}
const meta = {
  title: 'Features/Milestones/Memory editor',
  component: MilestoneDialogLayout,
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    onOpenChange: fn(),
    title: 'Novo marco',
    baby: buildBaby({ name: 'Alice', avatarColor: '#6950C7' }),
    moment: 'Primeiro sorriso',
    category: 'Social',
    categoryClassName: 'bg-amber-50 text-amber-800',
    date: '07/09/2026',
    description: 'Um momento que ficou na memória.',
    stage: 'core',
    dirty: false,
    busy: false,
    children: <Core />,
    footer: (close: () => void) => (
      <>
        <Button variant="ghost" onClick={close}>
          Cancelar
        </Button>
        <Button>Continuar</Button>
      </>
    ),
  },
} satisfies Meta<typeof MilestoneDialogLayout>
export default meta
type Story = StoryObj<typeof meta>
export const Moment: Story = {}
export const Dark: Story = { globals: { theme: 'dark' } }
export const LongMemory: Story = {
  args: {
    moment: 'A primeira vez que descobriu as flores do jardim com a família',
    description: 'Uma lembrança longa, cheia de pequenos detalhes para guardar e contar de novo.',
  },
}
