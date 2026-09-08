import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { buildBaby } from '@/test/fixtures/baby'
import { MedicationDialogLayout } from './MedicationDialogLayout'
import { MedicationFields } from './MedicationFields'
import { MedicationRecordNotice } from './MedicationRecordNotice'
import type { MedicationFormInput } from '../api/medications.schemas'

function Fields({ section = 'medicine' }: { section?: 'medicine' | 'details' }) {
  const { register, control, formState: { errors } } = useForm<MedicationFormInput>({ defaultValues: { name: '', startedOn: '2026-09-07', endedOn: '' } })
  return <div className="space-y-5">{section === 'medicine' && <MedicationRecordNotice />}<MedicationFields register={register} control={control} errors={errors} section={section} /></div>
}
const meta = {
  title: 'Features/Medications/Record editor', component: MedicationDialogLayout, parameters: { layout: 'fullscreen' },
  args: { open: true, onOpenChange: fn(), title: 'Registrar medicamento', stage: 'medicine', dirty: false, busy: false, baby: buildBaby({ name: 'Alice', avatarColor: '#6950C7' }), medicine: 'Medicamento registrado', dosage: 'Conforme receita', frequency: 'Conforme receita', date: '07/09/2026 · Sem término registrado', children: <Fields />, footer: (close: () => void) => <><Button variant="ghost" onClick={close}>Cancelar</Button><Button>Continuar</Button></> },
} satisfies Meta<typeof MedicationDialogLayout>
export default meta
type Story = StoryObj<typeof meta>
export const Medicine: Story = {}
export const Details: Story = { args: { stage: 'details', children: <Fields section="details" /> } }
export const Dark: Story = { globals: { theme: 'dark' } }
