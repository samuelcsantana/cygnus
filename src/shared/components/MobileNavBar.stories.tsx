import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { BellIcon } from '@/shared/icons/bell-icon'
import { DashboardIcon } from '@/shared/icons/dashboard-icon'
import { HeartIcon } from '@/shared/icons/heart-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'

import { MobileNavBar } from './MobileNavBar'

/** The six of the real bar, in the real order — the count is what is being tested. */
const items = [
  { to: '/dashboard', label: 'Início', icon: <DashboardIcon className="h-5 w-5" /> },
  { to: '/vaccines', label: 'Vacinas', icon: <SyringeIcon className="h-5 w-5" /> },
  { to: '/appointments', label: 'Consultas', icon: <StethoscopeIcon className="h-5 w-5" /> },
  { to: '/medications', label: 'Remédios', icon: <HeartIcon className="h-5 w-5" /> },
  { to: '/milestones', label: 'Marcos', icon: <SparkleIcon className="h-5 w-5" /> },
  { to: '/notifications', label: 'Avisos', icon: <BellIcon className="h-5 w-5" />, badge: 3 },
]

const meta = {
  title: 'Shared/MobileNavBar',
  component: MobileNavBar,
  parameters: {
    docs: {
      description: {
        component:
          'The bottom bar, phones only. It is here as a story because its width arithmetic needs ' +
          'a real browser to be checked and the bar itself only exists behind a session — ' +
          '`play` below is the regression gate on the 44px target floor.',
      },
    },
  },
  args: { items },
} satisfies Meta<typeof MobileNavBar>

export default meta
type Story = StoryObj<typeof meta>

/** The narrowest phone the app is measured at. Nothing about the bar depends on the viewport. */
const NARROWEST = 320
const FLOOR = 44

export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const bar = canvas.getByRole('navigation')
    const targets = within(bar).getAllByRole('link')

    await step('every item takes an equal share of the bar', async () => {
      // The floor below is arithmetic on the bar's width, and it is only true while the items
      // divide that width equally. A fixed width, a `min-width`, or a label long enough to push
      // its own item wider would all break the division while leaving the padding untouched —
      // so the division is asserted first, at whatever width the canvas happens to be.
      const widths = targets.map((target) => target.getBoundingClientRect().width)
      const share = Math.min(...widths)
      expect(Math.max(...widths) - share).toBeLessThan(1)
    })

    await step(`each target clears ${FLOOR}px at ${NARROWEST}px`, async () => {
      // Asserted as the formula rather than by resizing: the story canvas is not a phone, and
      // the number that matters is the one at the narrowest width the app claims to support.
      // Both terms are read off the real render — the padding from the computed style, the
      // count from the DOM — so an eighth item or a fatter padding fails here, which is the
      // whole reason this component was pulled out of the shell.
      const style = getComputedStyle(bar)
      const padding = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight)
      const targetAt320 = (NARROWEST - padding) / targets.length

      expect(targetAt320).toBeGreaterThanOrEqual(FLOOR)
    })
  },
}
