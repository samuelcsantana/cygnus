import type { Appointment } from '@/features/appointments/api/appointments.schemas'
import type { BabyMeasurement, SexAtBirth } from '@/features/babies/api/babies.schemas'
import { ageInMonthsAt, ageInMonthsExactAt } from '@/lib/date'

import { WHO_REFERENCE, WHO_REFERENCE_MAX_MONTHS, type WhoReferenceRow } from './who-reference'

/**
 * A dated profile measurement or completed visit, placed on an age axis.
 */
export interface GrowthPoint {
  appointmentId: string
  /** Visit timestamp or local noon for a date-only profile measurement. */
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
export function growthSeries(appointments: Appointment[], birthDate: string, measurements: BabyMeasurement[] = []): GrowthPoint[] {
  const visits = appointments
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
  const recorded = measurements.map((measurement): GrowthPoint => {
    // Calendar dates stay local. Noon avoids changing the recorded day in UTC offsets.
    const scheduledAt = `${measurement.measuredOn}T12:00:00`
    const at = new Date(scheduledAt)
    return {
      appointmentId: measurement.id,
      scheduledAt,
      ageMonths: ageInMonthsExactAt(birthDate, at),
      ageMonthsWhole: ageInMonthsAt(birthDate, at),
      weightGrams: measurement.weightGrams,
      heightMillimeters: measurement.heightMillimeters,
    }
  })
  return [...visits, ...recorded].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
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
 * The last row is **interpolated onto the edge**, not the first row past it. The
 * obvious version — keep one extra row and let the chart clamp it — clamps only
 * the x: the extra row's percentiles belong to an older child, so the band jumps
 * upward in a visible step right at the border. It looked like a rendering
 * glitch in the capture, which is how it was found.
 */
export function clipBand(
  rows: readonly WhoReferenceRow[] | null | undefined,
  maxAgeMonths: number,
): readonly WhoReferenceRow[] | null {
  if (!rows) return null

  const cut = rows.findIndex((row) => row[0] > maxAgeMonths)
  if (cut < 0) return rows.length > 1 ? rows : null

  const visible = rows.slice(0, cut)
  const before = visible.at(-1)
  const after = rows[cut]!

  if (before) {
    const ratio = (maxAgeMonths - before[0]) / (after[0] - before[0])
    visible.push([
      maxAgeMonths,
      ...([1, 2, 3, 4, 5] as const).map((column) =>
        Math.round(before[column] + (after[column] - before[column]) * ratio),
      ),
    ] as unknown as WhoReferenceRow)
  }

  return visible.length > 1 ? visible : null
}

/** Whether the child's series runs past the last age WHO publishes as a table. */
export function outgrewReference(points: GrowthPoint[]): boolean {
  return points.some((point) => point.ageMonths > WHO_REFERENCE_MAX_MONTHS)
}
