import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { formatDateDisplay, splitScheduledAt } from '@/lib/date'

import { clipBand, type GrowthIndicator, type GrowthPlotPoint } from '../api/growth.selectors'
import type { WhoReferenceRow } from '../api/who-reference'
import { niceScale, positionIn } from './growth-scale'

/** Tall enough for a curve to have a shape, short enough that two fit on one phone screen. */
const PLOT_HEIGHT = 168

interface GrowthChartProps {
  points: GrowthPlotPoint[]
  /** Turns a raw API value (grams, millimetres) into what a person reads. */
  formatValue: (value: number) => string
  /** The accessible name of the whole figure — the table below carries the numbers. */
  label: string
  indicator: GrowthIndicator
  /**
   * The WHO reference table, whole — this component clips it to its own axis,
   * because it is the only thing that knows where that axis ends. Absent when
   * there is no honest band to show; see `referenceBand`.
   */
  band?: readonly WhoReferenceRow[] | null
  className?: string
}

/**
 * One measure over age, drawn by hand.
 *
 * **No chart library.** The entry chunk is 138 kB gzip and the smallest of the
 * usual candidates is a third of that again for one line and two axes; this is a
 * polyline, a few rules and some absolutely-positioned text.
 *
 * **The geometry is SVG and every word is HTML.** `preserveAspectRatio="none"`
 * lets the plot stretch to whatever width the card has without arithmetic, and
 * `vector-effect="non-scaling-stroke"` keeps the line 2px through that stretch —
 * but text inside a stretched viewBox would be squashed horizontally and would
 * scale with the container instead of with the reader's font size. So the labels
 * are real HTML, positioned by percentage, and they respond to browser zoom and
 * to a larger default font like any other text on the page (WCAG 1.4.4).
 *
 * **Two measures, two charts, never two axes.** A second y scale on one plot
 * makes the crossing point of weight and height look like a fact, when it is an
 * artefact of where the two scales were pinned.
 *
 * The dots carry a hover tooltip and nothing else: they are not focusable, and
 * the figure is a single `role="img"`. Twelve tab stops that read out numbers
 * already sitting in the table below would be worse than useless for someone on
 * a keyboard.
 */
export function GrowthChart({ points, formatValue, label, indicator, band: table, className }: GrowthChartProps) {
  const { t, i18n } = useTranslation()
  const [hovered, setHovered] = useState<number | null>(null)

  const tone =
    indicator === 'weight'
      ? { stroke: 'stroke-emerald-700 dark:stroke-emerald-600', dot: 'bg-emerald-700 dark:bg-emerald-600' }
      : { stroke: 'stroke-violet-500 dark:stroke-violet-400', dot: 'bg-violet-500 dark:bg-violet-400' }

  // The age axis starts at birth, not at the first visit: a curve that opens at
  // "14 months" hides that nothing was recorded before it, and the gap is a fact
  // about the record worth seeing.
  //
  // A floor of one month on the span, because a newborn's only measurement is at
  // age ~0 and an axis with nothing to divide padded itself in both directions —
  // it printed -1 month, which is not a thing that happened to anybody. Whole
  // months, for the same reason: "0,25 meses" is a week, said the wrong way.
  const ageScale = niceScale(0, Math.max(...points.map((point) => point.x), 1), 4, { minStep: 1 })
  const band = clipBand(table, ageScale.max)

  // The value scale covers the band as well as the child, and that is the whole
  // point of drawing one: a curve that sits above P97 has to *look* like it sits
  // above P97, which it cannot do on an axis that stops at the child's own
  // maximum. The cost is a flatter-looking curve, which is honest — the shape was
  // never the message here, the position is.
  const bandValues = (band ?? []).flatMap((row) => [row[1], row[5]])
  const valueScale = niceScale(
    Math.min(...points.map((point) => point.y), ...bandValues),
    Math.max(...points.map((point) => point.y), ...bandValues),
  )

  const placed = points.map((point, index) => ({
    ...point,
    index,
    left: positionIn(ageScale, point.x) * 100,
    top: (1 - positionIn(valueScale, point.y)) * 100,
  }))

  const polyline = placed.map((point) => `${point.left},${point.top}`).join(' ')

  /** An area between two percentile columns, as an SVG path in the 0–100 box. */
  const area = (lower: number, upper: number) => {
    if (!band) return ''
    const x = (row: WhoReferenceRow) => positionIn(ageScale, row[0]) * 100
    const y = (row: WhoReferenceRow, column: number) => (1 - positionIn(valueScale, row[column]!)) * 100
    const top = band.map((row) => `${x(row)},${y(row, upper)}`).join(' L ')
    const bottom = [...band].reverse().map((row) => `${x(row)},${y(row, lower)}`).join(' L ')
    return `M ${top} L ${bottom} Z`
  }
  const active = hovered === null ? null : placed[hovered]

  return (
    <figure
      role="img"
      aria-label={label}
      className={cn('flex gap-2', className)}
      onMouseLeave={() => setHovered(null)}
    >
      {/* The value axis. Absolutely positioned rather than spread with
          `justify-between`, which would centre the first and last labels half a
          line off their own gridlines. */}
      <div className="relative w-11 flex-shrink-0" style={{ height: PLOT_HEIGHT }} aria-hidden="true">
        {valueScale.ticks.map((tick) => (
          <span
            key={tick}
            className="absolute right-0 -translate-y-1/2 font-mono text-[10px] whitespace-nowrap text-ink-faint"
            style={{ top: `${(1 - positionIn(valueScale, tick)) * 100}%` }}
          >
            {formatValue(tick)}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative" style={{ height: PLOT_HEIGHT }}>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            {valueScale.ticks.map((tick) => {
              const y = (1 - positionIn(valueScale, tick)) * 100
              return (
                <line
                  key={tick}
                  x1={0}
                  x2={100}
                  y1={y}
                  y2={y}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  className="stroke-border"
                />
              )
            })}
            {/* The reference goes under everything: it is context, not a
                series. Two layers of `--color-ink` at 8%: the inner one sits on
                the outer, so P15–P85 lands at about 15% and reads as the darker
                middle without a second colour to keep in contrast. `--color-ink`
                flips with the theme on its own, and the indicator's own colour
                is deliberately not used — a green band under a green line reads
                as a second measurement of the same thing. */}
            {band && (
              <>
                <path d={area(1, 5)} className="fill-ink/8" />
                <path d={area(2, 4)} className="fill-ink/8" />
                <path
                  d={`M ${band.map((row) => `${positionIn(ageScale, row[0]) * 100},${(1 - positionIn(valueScale, row[3]!)) * 100}`).join(' L ')}`}
                  fill="none"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  className="stroke-ink/25"
                />
              </>
            )}
            {placed.length > 1 && (
              <polyline
                points={polyline}
                fill="none"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className={tone.stroke}
              />
            )}
          </svg>

          {placed.map((point) => (
            <span
              key={`${point.scheduledAt}-${point.index}`}
              onMouseEnter={() => setHovered(point.index)}
              // 24px of hit area around an 8px dot: the dot is the mark, this is
              // the target, and on a phone the two cannot be the same size.
              className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ left: `${point.left}%`, top: `${point.top}%` }}
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full ring-2 ring-card transition-transform',
                  tone.dot,
                  hovered === point.index && 'scale-150',
                )}
              />
            </span>
          ))}

          {active && (
            <div
              // Above the dot, and pinned inside the plot at the ends — a tooltip
              // centred on the last point would hang off the card.
              className="pointer-events-none absolute z-10 -translate-y-full rounded-lg bg-ink px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-surface shadow-lg"
              style={{
                left: `${Math.min(Math.max(active.left, 12), 88)}%`,
                top: `${active.top}%`,
                transform: 'translate(-50%, calc(-100% - 10px))',
              }}
            >
              <span className="font-mono">{formatValue(active.y)}</span>
              <span className="mx-1 opacity-50">·</span>
              {/* The local calendar date, like every other visit in the app —
                  `slice(0, 10)` is the UTC one, and for a visit late in the day
                  it names a different day than the age beside it was counted
                  from. */}
              {formatDateDisplay(splitScheduledAt(active.scheduledAt).date, i18n.language)}
            </div>
          )}
        </div>

        <div className="relative mt-2 h-4" aria-hidden="true">
          {ageScale.ticks.map((tick) => (
            <span
              key={tick}
              className="absolute -translate-x-1/2 font-mono text-[10px] whitespace-nowrap text-ink-faint"
              style={{ left: `${positionIn(ageScale, tick) * 100}%` }}
            >
              {tick}
            </span>
          ))}
        </div>

        {/* The horizontal axis is bare numbers without this, and "12" beside
            "8,4 kg" is read as a second measurement. Hidden from screen readers
            with the rest of the figure — the label above carries the units. */}
        <figcaption className="mt-1 text-center text-[11px] text-ink-faint" aria-hidden="true">
          {t('growth.chart.ageAxis')}
        </figcaption>
      </div>
    </figure>
  )
}
