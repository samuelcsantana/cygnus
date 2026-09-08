import type { Appointment } from '../api/appointments.schemas'
import { AppointmentEditorDialog } from './AppointmentEditorDialog'

export function RescheduleDialog({ appointment, onOpenChange }: { appointment: Appointment | null; onOpenChange: (open: boolean) => void }) {
  return appointment ? <AppointmentEditorDialog key={appointment.id} appointment={appointment} onOpenChange={onOpenChange} /> : null
}
