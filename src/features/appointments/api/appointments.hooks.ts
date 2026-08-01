import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createAppointment, fetchAppointments, updateAppointment } from './appointments.api'
import type { Appointment, AppointmentFormInput, UpdateAppointmentInput } from './appointments.schemas'

export function appointmentsQueryKey(babyId: string) {
  return ['babies', babyId, 'appointments'] as const
}

export function useAppointments(babyId: string | null) {
  return useQuery({
    queryKey: appointmentsQueryKey(babyId ?? ''),
    queryFn: () => fetchAppointments(babyId!),
    enabled: !!babyId,
    select: (data) => [...data].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
  })
}

export function useCreateAppointment(babyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AppointmentFormInput) => createAppointment(babyId, input),
    onSuccess: (appointment) => {
      queryClient.setQueryData<Appointment[]>(appointmentsQueryKey(babyId), (prev) =>
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
