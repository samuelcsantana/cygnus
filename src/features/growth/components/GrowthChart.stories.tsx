import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { formatCentimeters, formatKilograms } from '@/shared/utils/measurements'

import type { GrowthPlotPoint } from '../api/growth.selectors'
import { GrowthChart } from './GrowthChart'

/** A first year with the visits a PNI schedule actually produces: dense early, then spaced out. */
const weightPoints: GrowthPlotPoint[] = [
  { x: 0.2, y: 3280, scheduledAt: '2026-01-21T10:00:00.000Z', ageMonthsWhole: 0 },
  { x: 1.1, y: 4150, scheduledAt: '2026-02-18T10:00:00.000Z', ageMonthsWhole: 1 },
  { x: 2.2, y: 5400, scheduledAt: '2026-03-24T10:00:00.000Z', ageMonthsWhole: 2 },
  { x: 4.1, y: 6800, scheduledAt: '2026-05-20T10:00:00.000Z', ageMonthsWhole: 4 },
  { x: 6.3, y: 7900, scheduledAt: '2026-07-28T10:00:00.000Z', ageMonthsWhole: 6 },
  { x: 12.4, y: 9600, scheduledAt: '2027-01-27T10:00:00.000Z', ageMonthsWhole: 12 },
]

const heightPoints: GrowthPlotPoint[] = [
  { x: 0.2, y: 490, scheduledAt: '2026-01-21T10:00:00.000Z', ageMonthsWhole: 0 },
  { x: 2.2, y: 580, scheduledAt: '2026-03-24T10:00:00.000Z', ageMonthsWhole: 2 },
  { x: 6.3, y: 670, scheduledAt: '2026-07-28T10:00:00.000Z', ageMonthsWhole: 6 },
  { x: 12.4, y: 750, scheduledAt: '2027-01-27T10:00:00.000Z', ageMonthsWhole: 12 },
]

const meta = {
  title: 'Growth/GrowthChart',
  component: GrowthChart,
  parameters: {
    docs: {
      description: {
        component:
          'One measure over age, drawn without a chart library. It is a story because three of ' +
          'its properties need a real browser: that the points are drawn in order and spread out ' +
          '(a clamped scale piles them on the edge instead of failing), that a dot is big enough ' +
          'to hit, and that the line is painted at all — a colour class the build never generated ' +
          'leaves an invisible curve and no error.',
      },
    },
  },
  args: {
    points: weightPoints,
    formatValue: (value: number) => formatKilograms(value, 'pt-BR'),
    label: 'Curva de peso de Ana, 6 medidas ao longo do tempo',
    indicator: 'weight' as const,
  },
} satisfies Meta<typeof GrowthChart>

export default meta
type Story = StoryObj<typeof meta>

/** WCAG 2.5.8 (AA). The dot is the mark, the span around it is the target. */
const TARGET_FLOOR = 24

export const Weight: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const figure = canvas.getByRole('img')
    const plot = figure.querySelector('svg')!.parentElement!
    const dots = [...plot.querySelectorAll<HTMLElement>(':scope > span')]

    await step('every measurement is drawn, in order, spread across the plot', async () => {
      // Not "every dot is inside the plot": `positionIn` clamps to 0–1, so a
      // scale that does not contain its own data piles points onto the edge
      // instead of drawing outside it, and a bounds check passes on a broken
      // chart. Confirmed: shrinking the age scale to a third left a bounds
      // check green with three points stacked on the right edge.
      //
      // What a clamp cannot fake is order and spread: the input x values are
      // strictly increasing, so the drawn centres must be too, and a flat value
      // scale would stack every dot at one height.
      expect(dots).toHaveLength(weightPoints.length)

      const centres = dots.map((dot) => {
        const rect = dot.getBoundingClientRect()
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      })

      for (let index = 1; index < centres.length; index++) {
        expect(centres[index]!.x).toBeGreaterThan(centres[index - 1]!.x)
      }
      expect(new Set(centres.map((centre) => Math.round(centre.y))).size).toBeGreaterThan(1)
    })

    await step(`a dot is at least ${TARGET_FLOOR}px to hit`, async () => {
      for (const dot of dots) {
        const rect = dot.getBoundingClientRect()
        expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(TARGET_FLOOR)
      }
    })

    await step('the line is actually painted', async () => {
      // The trap this exists for: Tailwind only emits a class the source uses,
      // so a mistyped or invented colour utility is simply absent from the CSS
      // and the curve renders in the SVG default — black, or nothing at all.
      // Neither throws and neither shows up in a screenshot review of one theme.
      const line = plot.querySelector('polyline')!
      const stroke = getComputedStyle(line).stroke

      expect(stroke).not.toBe('none')
      expect(stroke).not.toBe('rgb(0, 0, 0)')
    })
  },
}

export const Height: Story = {
  args: {
    points: heightPoints,
    formatValue: (value: number) => formatCentimeters(value, 'pt-BR'),
    label: 'Curva de altura de Ana, 4 medidas ao longo do tempo',
    indicator: 'height' as const,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const line = canvas.getByRole('img').querySelector('polyline')!

    await step('height is painted, and not in the weight colour', async () => {
      // The two charts sit one above the other on the page. Same hue for both
      // would be the one thing a reader glancing between them cannot recover.
      const stroke = getComputedStyle(line).stroke
      expect(stroke).not.toBe('none')
      expect(stroke).not.toBe('rgb(0, 0, 0)')
      expect(stroke).not.toBe(WEIGHT_STROKE)
    })
  },
}

/** emerald-700, the weight curve in light mode — the value the Weight story paints. */
const WEIGHT_STROKE = 'rgb(4, 120, 87)'

/**
 * One visit. There is no line to draw, and the axis has no range to divide —
 * both of which used to be division by zero somewhere.
 */
export const SingleMeasurement: Story = {
  args: { points: [weightPoints[0]!], label: 'Curva de peso de Ana, 1 medida' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const figure = canvas.getByRole('img')

    await step('draws the dot and no line', async () => {
      expect(figure.querySelector('polyline')).toBeNull()
      expect(figure.querySelectorAll('svg > line').length).toBeGreaterThan(1)
    })

    await step('the axis still prints distinct labels', async () => {
      // With one point min equals max: the step is zero and every label is the
      // same number, which reads as a broken chart rather than a single reading.
      const labels = [...figure.querySelectorAll('span')]
        .map((span) => span.textContent?.trim())
        .filter((text): text is string => !!text && text.includes('kg'))

      expect(new Set(labels).size).toBe(labels.length)
    })
  },
}
