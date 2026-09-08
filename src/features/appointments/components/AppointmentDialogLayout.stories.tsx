import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { buildBaby } from '@/test/fixtures/baby'
import { AppointmentDialogLayout } from './AppointmentDialogLayout'
import { AppointmentScheduleFields } from './AppointmentScheduleFields'
import { AppointmentMeasurementFields } from './AppointmentMeasurementFields'
import type { AppointmentFormInput } from '../api/appointments.schemas'

function Details({ completed = false, reschedule = false }: { completed?: boolean; reschedule?: boolean }) {
  const { register, control, formState: { errors } } = useForm<AppointmentFormInput>({ defaultValues: { date: '2026-09-10', time: '14:30', status: completed ? 'COMPLETED' : 'SCHEDULED' } })
  return <div className="space-y-5"><AppointmentScheduleFields register={register} control={control} errors={errors} hideIntent={reschedule} />{completed && <AppointmentMeasurementFields register={register} errors={errors} />}</div>
}
const meta = {
  title: 'Features/Appointments/Scheduling dialog', component: AppointmentDialogLayout,
  parameters: { layout: 'fullscreen' },
  args: { open: true, onOpenChange: fn(), title: 'Agendar consulta', stage: 'schedule', dirty: false, busy: false, baby: buildBaby({ name: 'Alice', avatarColor: '#6950C7' }), professional: 'Dra. Ana Silva', specialty: 'Pediatria', location: 'Clínica Jardim', date: '10/09/2026 · 14:30', children: <Details />, footer: (close: () => void) => <><Button variant="ghost" onClick={close}>Voltar</Button><Button>Agendar consulta</Button></> },
} satisfies Meta<typeof AppointmentDialogLayout>
export default meta
type Story = StoryObj<typeof meta>
export const Schedule: Story = {}
export const Completed: Story = { args: { title: 'Registrar consulta realizada', children: <Details completed /> } }
export const Reschedule: Story = { args: { title: 'Reagendar consulta', children: <Details reschedule /> } }
export const Dark: Story = { globals: { theme: 'dark' } }
