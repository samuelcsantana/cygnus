import type { Appointment } from '../api/appointments.schemas'
export type AppointmentView = 'ALL' | 'UPCOMING' | 'REVIEW' | 'COMPLETED' | 'CANCELLED'
export function appointmentGroup(
  appointment: Appointment,
  now: number,
): Exclude<AppointmentView, 'ALL'> {
  return appointment.status === 'SCHEDULED'
    ? new Date(appointment.scheduledAt).getTime() >= now
      ? 'UPCOMING'
      : 'REVIEW'
    : appointment.status
}
export function sortAppointments(items: Appointment[], now: number) {
  const rank = { UPCOMING: 0, REVIEW: 1, COMPLETED: 2, CANCELLED: 3 }
  return [...items].sort((a, b) => {
    const groupA = appointmentGroup(a, now),
      groupB = appointmentGroup(b, now)
    return (
      rank[groupA] - rank[groupB] ||
      (groupA === 'UPCOMING'
        ? a.scheduledAt.localeCompare(b.scheduledAt)
        : b.scheduledAt.localeCompare(a.scheduledAt))
    )
  })
}
