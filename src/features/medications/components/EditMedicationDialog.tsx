import type { Medication } from '../api/medications.schemas'
import { MedicationEditorDialog } from './MedicationEditorDialog'

export function EditMedicationDialog({
  medication,
  onOpenChange,
}: {
  medication: Medication | null
  onOpenChange: (open: boolean) => void
}) {
  return medication ? (
    <MedicationEditorDialog
      key={medication.id}
      medication={medication}
      onOpenChange={onOpenChange}
    />
  ) : null
}
