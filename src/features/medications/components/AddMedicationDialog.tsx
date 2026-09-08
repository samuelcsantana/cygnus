import { MedicationEditorDialog } from './MedicationEditorDialog'

export function AddMedicationDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return open ? <MedicationEditorDialog onOpenChange={onOpenChange} /> : null
}
