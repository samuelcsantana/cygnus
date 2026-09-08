import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { buildBaby } from '@/test/fixtures/baby'
import { VaccineDialogLayout } from './VaccineDialogLayout'
import { VaccineApplicationDetailsFields } from './VaccineApplicationDetailsFields'
import type { ApplyVaccineInput } from '../api/vaccines.schemas'

function Details() {
  const { register, control, formState: { errors } } = useForm<ApplyVaccineInput>({ defaultValues: { applicationDate: '2026-01-10' } })
  return <VaccineApplicationDetailsFields register={register} control={control} errors={errors} />
}
const meta = {
  title: 'Features/Vaccines/Record dialog', component: VaccineDialogLayout,
  parameters: { layout: 'fullscreen' },
  args: { open: true, onOpenChange: fn(), title: 'Registrar vacina', stage: 'details', dirty: false, busy: false, baby: buildBaby({ name: 'Alice', avatarColor: '#6950C7' }), vaccine: 'Hepatite B', dose: '1ª dose', date: '10/01/2026', children: <Details />, footer: (close: () => void) => <><Button variant="ghost" onClick={close}>Cancelar</Button><Button>Salvar vacina</Button></> },
} satisfies Meta<typeof VaccineDialogLayout>
export default meta
type Story = StoryObj<typeof meta>
export const Application: Story = {}
export const Dark: Story = { globals: { theme: 'dark' } }
