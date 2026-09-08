import { AppointmentEditorDialog } from './AppointmentEditorDialog'

export function AddAppointmentDialog({
  open,
  onOpenChange,
  initialStatus,
}: {
  open: boolean
  initialStatus?: 'SCHEDULED' | 'COMPLETED'
  onOpenChange: (open: boolean) => void
}) {
  return open ? (
    <AppointmentEditorDialog onOpenChange={onOpenChange} initialStatus={initialStatus} />
  ) : null
}
