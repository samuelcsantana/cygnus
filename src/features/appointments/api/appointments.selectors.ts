import type { Appointment } from './appointments.schemas'

/**
 * The most recent visit that actually measured something.
 *
 * The pair is taken from **one** visit rather than the latest weight and the latest height read
 * independently. Two numbers from two different days, shown side by side with a single date, would
 * be a lie about at least one of them — and this card has room for one date, not two.
 *
 * Cancelled visits are excluded even though the API can hold a measurement on one (it only refuses
 * measurements on a visit still to come): a visit that was called off did not weigh anybody.
 */
export function latestMeasuredVisit(appointments: Appointment[]): Appointment | null {
  const measured = appointments.filter(
    (appointment) =>
      appointment.status === 'COMPLETED' &&
      (appointment.weightGrams !== null || appointment.heightMillimeters !== null),
  )

  if (measured.length === 0) {
    return null
  }

  return measured.reduce((latest, candidate) =>
    candidate.scheduledAt > latest.scheduledAt ? candidate : latest,
  )
}
