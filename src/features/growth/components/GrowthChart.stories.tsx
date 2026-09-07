import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { formatCentimeters, formatKilograms } from '@/shared/utils/measurements'

import { referenceBand, type GrowthPlotPoint } from '../api/growth.selectors'
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

/**
 * The alpha of a computed colour, whatever notation the browser chose.
 *
 * Tailwind v4 emits `oklab(... / 0.08)` and older stacks emit `rgba(r, g, b, a)`;
 * a colour with **no** alpha component — the plain `rgb(0, 0, 0)` an SVG falls
 * back to when the class never made it into the CSS — returns undefined, which
 * is exactly the case worth failing on.
 */
const alphaOf = (colour: string) =>
  /\/\s*([\d.]+)\s*\)/.exec(colour)?.[1] ?? /rgba\([^)]*?,\s*([\d.]+)\)/.exec(colour)?.[1]

/**
 * With the WHO band behind it. The band is the reason the page exists for most
 * readers — "is that normal?" is the question a curve is looked at to answer.
 */
export const WithReference: Story = {
  args: { band: referenceBand('weight', 'MALE') },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const svg = canvas.getByRole('img').querySelector('svg')!
    const areas = [...svg.querySelectorAll('path')]

    await step('the band is painted, not just present', async () => {
      // Same trap as the curve's stroke, and worse here: an area with no fill is
      // invisible, and the legend under the chart goes on claiming there is a
      // reference band. `fill-ink/8` has to survive whatever Tailwind generates.
      expect(areas.length).toBeGreaterThanOrEqual(2)

      for (const area of areas.slice(0, 2)) {
        const fill = getComputedStyle(area).fill
        // Read as "has an alpha channel", which is what `fill-ink/8` computes
        // to. A missing class leaves the SVG default — an opaque `rgb(0, 0, 0)`
        // with no alpha at all — so this fails on exactly the case it exists
        // for, and would also fail if the opacity were dialled to zero.
        const alpha = alphaOf(fill)
        expect(fill, 'a faixa não recebeu cor nenhuma').not.toBe('none')
        expect(alpha, `fill sem canal alfa: ${fill}`).toBeDefined()
        expect(Number(alpha)).toBeGreaterThan(0)
      }
    })

    await step('the band stops where the axis does', async () => {
      // The table runs to five years and this child is not five. A band drawn
      // whole would push the age axis out and squash the child's own curve into
      // the left tenth of the plot — the failure this clipping exists to avoid.
      const plot = svg.parentElement!.getBoundingClientRect()
      const drawn = areas[0]!.getBoundingClientRect()

      expect(drawn.right).toBeLessThanOrEqual(plot.right + 1)
      expect(drawn.width).toBeGreaterThan(plot.width * 0.8)
    })

    await step("the child's line is still the loudest thing", async () => {
      // A reference that competes with the measurement defeats itself. Asserted
      // as opacity rather than by eye: the areas are ink at 8%, the line is a
      // solid colour.
      const line = svg.querySelector('polyline')!
      const alpha = Number(alphaOf(getComputedStyle(areas[0]!).fill))

      expect(getComputedStyle(line).strokeOpacity).toBe('1')
      expect(alpha).toBeLessThan(0.2)
    })
  },
}
