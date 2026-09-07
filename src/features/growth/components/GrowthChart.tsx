import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { formatDateDisplay } from '@/lib/date'

import type { GrowthIndicator, GrowthPlotPoint } from '../api/growth.selectors'
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
export function GrowthChart({ points, formatValue, label, indicator, className }: GrowthChartProps) {
  const { t, i18n } = useTranslation()
  const [hovered, setHovered] = useState<number | null>(null)

  const tone =
    indicator === 'weight'
      ? { stroke: 'stroke-emerald-700 dark:stroke-emerald-600', dot: 'bg-emerald-700 dark:bg-emerald-600' }
      : { stroke: 'stroke-violet-500 dark:stroke-violet-400', dot: 'bg-violet-500 dark:bg-violet-400' }

  const valueScale = niceScale(
    Math.min(...points.map((point) => point.y)),
    Math.max(...points.map((point) => point.y)),
  )
  // The age axis starts at birth, not at the first visit: a curve that opens at
  // "14 months" hides that nothing was recorded before it, and the gap is a fact
  // about the record worth seeing.
  const ageScale = niceScale(0, Math.max(...points.map((point) => point.x)))

  const placed = points.map((point, index) => ({
    ...point,
    index,
    left: positionIn(ageScale, point.x) * 100,
    top: (1 - positionIn(valueScale, point.y)) * 100,
  }))

  const polyline = placed.map((point) => `${point.left},${point.top}`).join(' ')
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
              {formatDateDisplay(active.scheduledAt.slice(0, 10), i18n.language)}
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
