import { useMedicalSpecialties } from '@/features/appointments/api/appointments.hooks'
import { useBabies } from '@/features/babies/api/babies.hooks'
import {
  useCoGuardiansState,
  useCreateSpecialist,
  useUpdateSpecialist,
} from '../api/specialists.hooks'
import type { Specialist } from '../api/specialists.schemas'
import { SpecialistEditor } from './SpecialistEditor'

interface Props {
  open: boolean
  specialist: Specialist | null
  currentUserId: string | undefined
  onOpenChange: (open: boolean) => void
}

export function SpecialistDialog(props: Props) {
  return props.open ? <ConnectedEditor key={props.specialist?.id ?? 'new'} {...props} /> : null
}

function ConnectedEditor({ specialist, currentUserId, onOpenChange }: Props) {
  const babies = useBabies()
  const guardians = useCoGuardiansState(currentUserId)
  const specialties = useMedicalSpecialties()
  const create = useCreateSpecialist()
  const update = useUpdateSpecialist()
  return (
    <SpecialistEditor
      specialist={specialist}
      babies={babies.data ?? []}
      guardians={guardians.data}
      specialties={specialties.data ?? []}
      babiesLoading={babies.isPending}
      babiesError={babies.isError}
      guardiansLoading={guardians.isPending}
      guardiansError={guardians.isError}
      specialtiesLoading={specialties.isPending}
      specialtiesError={specialties.isError}
      retryBabies={() => {
        void babies.refetch()
      }}
      retryGuardians={guardians.retry}
      retrySpecialties={() => {
        void specialties.refetch()
      }}
      onOpenChange={onOpenChange}
      onSave={async (input) => {
        if (specialist) await update.mutateAsync({ specialistId: specialist.id, input })
        else await create.mutateAsync(input)
      }}
    />
  )
}
