import type { Appointment } from '@/features/appointments/api/appointments.schemas'
import type { SexAtBirth } from '@/features/babies/api/babies.schemas'
import { ageInMonthsAt, ageInMonthsExactAt } from '@/lib/date'

import { WHO_REFERENCE, WHO_REFERENCE_MAX_MONTHS, type WhoReferenceRow } from './who-reference'

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

/**
 * The WHO reference table for this indicator and sex, whole.
 *
 * `null` — never an empty array — when there is none to draw. The WHO curves are
 * one for boys and one for girls; there is no neutral table, and picking either
 * one for a child whose sex at birth was not recorded would be inventing the
 * comparison. `sexAtBirth` is optional since #82 and left blank on purpose by
 * people who have their reasons, so the page says why the band is missing rather
 * than guessing.
 */
export function referenceBand(
  indicator: GrowthIndicator,
  sexAtBirth: SexAtBirth | null,
): readonly WhoReferenceRow[] | null {
  return sexAtBirth ? WHO_REFERENCE[indicator][sexAtBirth] : null
}

/**
 * The rows a chart whose age axis ends at `maxAgeMonths` should draw.
 *
 * Clipping matters more than it sounds: the tables run to five years, and a
 * fourteen-month-old's curve on a five-year axis is a squiggle in the left tenth.
 * The axis belongs to the child; the reference covers the part of it that exists.
 *
 * **The chart clips, not the caller** — it is the only thing that knows where its
 * axis ends, and that end is not simply the oldest measurement (a newborn's axis
 * has a one-month floor). A band cut to the child's age instead of to the axis
 * stops mid-plot, with a visible step.
 *
 * One row past the edge is kept for the same reason: without it the fill ends
 * just short of the border.
 */
export function clipBand(
  rows: readonly WhoReferenceRow[] | null | undefined,
  maxAgeMonths: number,
): readonly WhoReferenceRow[] | null {
  if (!rows) return null

  const cut = rows.findIndex((row) => row[0] > maxAgeMonths)
  const visible = cut < 0 ? rows : rows.slice(0, cut + 1)

  return visible.length > 1 ? visible : null
}

/** Whether the child's series runs past the last age WHO publishes as a table. */
export function outgrewReference(points: GrowthPoint[]): boolean {
  return points.some((point) => point.ageMonths > WHO_REFERENCE_MAX_MONTHS)
}
