import type { Meta, StoryObj } from '@storybook/react-vite'
import { AppointmentsOverviewCard } from '@/features/appointments/components/AppointmentsOverviewCard'
import { VaccinesOverviewCard } from '@/features/vaccines/components/VaccinesOverviewCard'
import { MedicationsOverviewCard } from '@/features/medications/components/MedicationsOverviewCard'
import { MilestonesOverviewCard } from '@/features/milestones/components/MilestonesOverviewCard'
import { buildBaby } from '@/test/fixtures/baby'
import { buildAppointment } from '@/test/fixtures/appointment'

const baby = buildBaby({ name: 'Sofia' })
function Overview({ empty = false, isPending = false, isError = false }: { empty?: boolean; isPending?: boolean; isError?: boolean }) {
  const shared = { babies: [baby], isPending, isError }
  return <div className="grid gap-5 bg-surface p-5 md:grid-cols-2">
    <AppointmentsOverviewCard {...shared} items={empty ? [] : [buildAppointment({ babyId: baby.id, scheduledAt: '2099-09-10T13:00:00Z' })]} />
    <VaccinesOverviewCard {...shared} items={empty ? [] : [{ babyId: baby.id, vaccineId: baby.id, name: 'BCG', description: '', guidance: null, doseNumber: 1, recommendedAgeInMonths: 0, recommendationKind: 'ROUTINE', status: 'DELAYED', applicationDate: null, notes: null, batchNumber: null, location: null, professional: null, photoUrl: null }]} />
    <MedicationsOverviewCard {...shared} items={empty ? [] : [{ id: baby.id, babyId: baby.id, name: 'Medicamento registrado', dosage: null, frequency: null, reason: null, prescriberName: null, startedOn: '2026-09-01', endedOn: null, notes: null, createdAt: '2026-09-01T12:00:00Z' }]} />
    <MilestonesOverviewCard {...shared} items={empty ? [] : [{ id: baby.id, babyId: baby.id, title: 'Primeiros passos', description: null, achievedAt: '2026-09-01', category: 'MOTOR', photoUrl: null, createdAt: '2026-09-01T12:00:00Z' }]} />
  </div>
}
const meta = { title: 'Dashboard/Overview cards', component: Overview } satisfies Meta<typeof Overview>
export default meta
type Story = StoryObj<typeof meta>
export const Populated: Story = {}
export const Dark: Story = { globals: { theme: 'dark' } }
export const Empty: Story = { args: { empty: true } }
export const Loading: Story = { args: { isPending: true } }
export const Error: Story = { args: { isError: true } }
