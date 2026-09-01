import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'

import { useBabies } from '@/features/babies/api/babies.hooks'
import type { Baby } from '@/features/babies/api/babies.schemas'

import { createAppointment, fetchAppointments, fetchMedicalSpecialties, updateAppointment,
  deleteAppointment,
} from './appointments.api'
import type { Appointment, AppointmentFormInput, UpdateAppointmentInput } from './appointments.schemas'

export function appointmentsQueryKey(babyId: string) {
  return ['babies', babyId, 'appointments'] as const
}

function sortByScheduledAt(items: Appointment[]): Appointment[] {
  return [...items].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
}

export function useAppointments(babyId: string | null) {
  return useQuery({
    queryKey: appointmentsQueryKey(babyId ?? ''),
    queryFn: () => fetchAppointments(babyId!),
    enabled: !!babyId,
    select: sortByScheduledAt,
  })
}

export interface BabyAppointmentsEntry {
  baby: Baby
  items: Appointment[]
  isPending: boolean
  isError: boolean
}

export interface AllBabiesAppointments {
  babies: Baby[]
  isPending: boolean
  isError: boolean
  isEmpty: boolean
  perBaby: BabyAppointmentsEntry[]
  items: Appointment[]
}

export function useAllBabiesAppointments(): AllBabiesAppointments {
  const babies = useBabies()
  const babyList = babies.data ?? []

  const results = useQueries({
    queries: babyList.map((baby) => ({
      queryKey: appointmentsQueryKey(baby.id),
      queryFn: () => fetchAppointments(baby.id),
      enabled: babies.isSuccess,
      select: sortByScheduledAt,
    })),
  })

  const perBaby: BabyAppointmentsEntry[] = babyList.map((baby, index) => {
    const result = results[index]
    return {
      baby,
      items: result?.data ?? [],
      isPending: result?.isPending ?? true,
      isError: result?.isError ?? false,
    }
  })

  return {
    babies: babyList,
    isPending: babies.isPending || (babies.isSuccess && results.some((result) => result.isPending)),
    isError: babies.isError || results.some((result) => result.isError),
    isEmpty: babies.isSuccess && babyList.length === 0,
    perBaby,
    items: perBaby.flatMap((entry) => entry.items),
  }
}

// Static reference data (medical specialties) — cached for the whole session, no need to refetch.
// No `initialData` here: seeding one would mark the query fresh before the first real
// fetch and, combined with `staleTime: Infinity`, permanently skip it.
export function useMedicalSpecialties() {
  return useQuery({
    queryKey: ['medical-specialties'],
    queryFn: fetchMedicalSpecialties,
    staleTime: Infinity,
  })
}

export function useCreateAppointment(babyId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AppointmentFormInput) => createAppointment(babyId!, input),
    onSuccess: (appointment) => {
      queryClient.setQueryData<Appointment[]>(appointmentsQueryKey(babyId ?? ''), (prev) =>
        prev ? [...prev, appointment] : [appointment],
      )
    },
  })
}

interface UpdateAppointmentVariables {
  appointmentId: string
  input: UpdateAppointmentInput
}

export function useUpdateAppointment(babyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appointmentId, input }: UpdateAppointmentVariables) =>
      updateAppointment(babyId, appointmentId, input),
    onSuccess: (updated) => {
      queryClient.setQueryData<Appointment[]>(appointmentsQueryKey(babyId), (prev) =>
        prev?.map((appointment) => (appointment.id === updated.id ? updated : appointment)),
      )
    },
  })
}

export function useDeleteAppointment(babyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (appointmentId: string) => deleteAppointment(babyId, appointmentId),
    // Removed from the cached list rather than refetched, matching
    // useDeleteMilestone: the row disappears the moment the API confirms, with
    // no window where a deleted appointment is still on screen.
    onSuccess: (_data, deletedAppointmentId) => {
      queryClient.setQueryData<Appointment[]>(appointmentsQueryKey(babyId), (prev) =>
        prev?.filter((item) => item.id !== deletedAppointmentId),
      )
    },
  })
}
