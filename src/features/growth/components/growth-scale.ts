/**
 * The arithmetic behind an axis, kept out of the component so it can be tested
 * without a browser: where the ticks fall, and where a value sits between them.
 */

export interface Scale {
  min: number
  max: number
  ticks: number[]
}

/**
 * Rounds a range out to values a person would have chosen — steps of 1, 2, 2.5
 * or 5 times a power of ten, and bounds that land on one of them.
 *
 * An axis from 5.4 to 15.8 in four equal parts is arithmetically fine and
 * unreadable: nobody holds "8.0", "10.6", "13.2" in their head to place a dot
 * between them. The cost of nice numbers is a little empty space at each end,
 * which a growth curve can afford — it is a shape, not a measurement to be read
 * off the grid.
 */
export function niceScale(min: number, max: number, tickCount = 4, options: { minStep?: number } = {}): Scale {
  // A flat series — one point, or several identical ones — has no range to
  // divide. Without this the step is 0 and every tick prints the same number.
  if (!Number.isFinite(min) || !Number.isFinite(max) || max - min < Number.EPSILON) {
    const centre = Number.isFinite(min) ? min : 0
    const pad = Math.max(Math.abs(centre) * 0.1, options.minStep ?? 1)
    // A range opened around a single value must not cross a bound the data
    // cannot cross: an age axis padded downwards prints -1 month, which is not
    // a thing that happened to anybody.
    const low = min === 0 ? 0 : centre - pad
    return niceScale(low, centre + pad, tickCount, options)
  }

  const step = withMinimum(niceStep((max - min) / Math.max(tickCount, 1)), options.minStep)
  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step

  const ticks: number[] = []
  // Counted rather than accumulated: adding `step` repeatedly drifts (0.1 * 3
  // is 0.30000000000000004) and the drift lands in a printed axis label.
  const count = Math.round((niceMax - niceMin) / step)
  for (let index = 0; index <= count; index++) {
    ticks.push(round(niceMin + index * step))
  }

  return { min: round(niceMin), max: round(niceMax), ticks }
}

/**
 * Rounds a step up to a whole number of `minStep`s.
 *
 * The age axis is counted in months, and a tick every 0.25 months is not a unit
 * anybody reads — "0,25 meses" is a week, said the wrong way. Weight and height
 * pass no minimum and keep their decimals.
 */
function withMinimum(step: number, minStep: number | undefined): number {
  if (!minStep) return step
  return Math.max(Math.ceil(step / minStep) * minStep, minStep)
}

function niceStep(rough: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const normalised = rough / magnitude

  if (normalised <= 1) return magnitude
  if (normalised <= 2) return 2 * magnitude
  if (normalised <= 2.5) return 2.5 * magnitude
  if (normalised <= 5) return 5 * magnitude
  return 10 * magnitude
}

/** Floating-point crumbs, swept up before a number becomes a label. */
function round(value: number): number {
  return Number(value.toFixed(6))
}

/** Where a value sits inside a scale, as a 0–1 fraction. Clamped, so a stray value stays in the box. */
export function positionIn(scale: Scale, value: number): number {
  if (scale.max === scale.min) return 0.5
  return Math.min(Math.max((value - scale.min) / (scale.max - scale.min), 0), 1)
}
