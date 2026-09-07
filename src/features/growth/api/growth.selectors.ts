import type { Appointment } from '@/features/appointments/api/appointments.schemas'
import { ageInMonthsAt, ageInMonthsExactAt } from '@/lib/date'

/**
 * One visit that measured something, placed on an age axis.
 *
 * There is no growth endpoint and there does not need to be one: weight and
 * height are recorded on the visit that took them, so the series is the visits,
 * read in order. That also means the curve can never disagree with the
 * appointment list — they are the same rows.
 */
export interface GrowthPoint {
  appointmentId: string
  /** The visit's instant, exactly as the API stores it. */
  scheduledAt: string
  /** Where the point sits on the axis: age in months, fractional. */
  ageMonths: number
  /** How that age is read out loud: completed months. */
  ageMonthsWhole: number
  weightGrams: number | null
  heightMillimeters: number | null
}

/**
 * The measured visits of one child, oldest first.
 *
 * Same admission rule as `latestMeasuredVisit`, and for the same reason: only
 * `COMPLETED`, because a cancelled visit did not weigh anybody even though the
 * API will hold a measurement on one. A visit with neither number is not a point
 * — a gap in the curve is honest, a point at zero is not.
 *
 * Oldest first because a curve is read left to right; the appointment list sorts
 * the other way, which is right for "what happened recently" and wrong here.
 */
export function growthSeries(appointments: Appointment[], birthDate: string): GrowthPoint[] {
  return appointments
    .filter(
      (appointment) =>
        appointment.status === 'COMPLETED' &&
        (appointment.weightGrams !== null || appointment.heightMillimeters !== null),
    )
    .map((appointment) => {
      const at = new Date(appointment.scheduledAt)
      return {
        appointmentId: appointment.id,
        scheduledAt: appointment.scheduledAt,
        ageMonths: ageInMonthsExactAt(birthDate, at),
        ageMonthsWhole: ageInMonthsAt(birthDate, at),
        weightGrams: appointment.weightGrams,
        heightMillimeters: appointment.heightMillimeters,
      }
    })
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
}

export type GrowthIndicator = 'weight' | 'height'

/** A point as a chart reads it: an x, a y, and enough to label the tooltip. */
export interface GrowthPlotPoint {
  x: number
  y: number
  scheduledAt: string
  ageMonthsWhole: number
}

/**
 * The points of one indicator, dropping the visits that did not record it.
 *
 * Dropping rather than interpolating: a visit that weighed the child without
 * measuring her is not evidence about her height, and a line drawn straight
 * across the gap says it is. The two indicators therefore have different point
 * counts on the same page, which is the truth about how the visits went.
 */
export function indicatorPoints(points: GrowthPoint[], indicator: GrowthIndicator): GrowthPlotPoint[] {
  return points
    .map((point) => {
      const raw = indicator === 'weight' ? point.weightGrams : point.heightMillimeters
      return raw === null
        ? null
        : {
            x: point.ageMonths,
            y: raw,
            scheduledAt: point.scheduledAt,
            ageMonthsWhole: point.ageMonthsWhole,
          }
    })
    .filter((point): point is GrowthPlotPoint => point !== null)
}
