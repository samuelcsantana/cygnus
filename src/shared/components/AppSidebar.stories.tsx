import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within, userEvent, waitFor } from 'storybook/test'

import { DashboardIcon } from '@/shared/icons/dashboard-icon'
import { HeartIcon } from '@/shared/icons/heart-icon'
import { GrowthIcon } from '@/shared/icons/growth-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'
import { UsersIcon } from '@/shared/icons/users-icon'

import { AppSidebar } from './AppSidebar'
import { ThemeContext } from '@/app/providers/theme-context'

/**
 * The real sections, in the real order. Seven, and notifications is not among
 * them: it is the bell in the top bar, not a row here — see the shell.
 * "Profissionais" is the longest label the app ships and the one the bottom bar
 * could not show at any width.
 */
const items = [
  { to: '/dashboard', label: 'Visão geral', icon: <DashboardIcon className="h-5 w-5" /> },
  { to: '/vaccines', label: 'Vacinas', icon: <SyringeIcon className="h-5 w-5" /> },
  { to: '/appointments', label: 'Consultas', icon: <StethoscopeIcon className="h-5 w-5" /> },
  { to: '/profissionais', label: 'Profissionais', icon: <UsersIcon className="h-5 w-5" /> },
  { to: '/medications', label: 'Medicamentos', icon: <HeartIcon className="h-5 w-5" /> },
  { to: '/crescimento', label: 'Crescimento', icon: <GrowthIcon className="h-5 w-5" /> },
  { to: '/milestones', label: 'Marcos', icon: <SparkleIcon className="h-5 w-5" /> },
]

/**
 * 272px is `w-68`, the drawer's width on a phone — the narrowest the menu is
 * ever rendered at, and narrower than the 256px-plus-gutter column on a desktop.
 * Measuring the wide case would prove nothing about the tight one.
 */
const DRAWER_WIDTH = 272
const FLOOR = 44

const meta = {
  title: 'Shared/AppSidebar',
  component: AppSidebar,
  parameters: {
    docs: {
      description: {
        component:
          'The side menu, identical on a phone (inside the drawer) and on a wide screen (as a ' +
          'fixed column). It is a story because the 44px target floor and the "no label wraps" ' +
          'rule need a real browser to be checked, and the menu itself only exists behind a session.',
      },
    },
  },
  args: {
    items,

    showAccount: true,
    accountName: 'Ana Andrade',
    accountEmail: 'ana@email.com',
    onAddBaby: () => {},
    onLogout: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: DRAWER_WIDTH, height: 640 }}>
        <ThemeContext.Provider
          value={{ theme: 'system', resolvedTheme: 'light', setTheme: () => {} }}
        >
          <Story />
        </ThemeContext.Provider>
      </div>
    ),
  ],
} satisfies Meta<typeof AppSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation')
    const rows = within(nav).getAllByRole('link')

    await step(`every section clears ${FLOOR}px at ${DRAWER_WIDTH}px`, async () => {
      // The floor the bottom bar had to divide for is a property of the row here: the width is
      // the same for all of them, so only the height can fail. Read off the real render, so a
      // shrunken padding or a smaller type scale fails here rather than on someone's phone.
      for (const row of rows) {
        expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(FLOOR)
      }
    })

    await step('every label is shown whole', async () => {
      // The promise the side menu was adopted for: "Profissionais" needs ~90px and could not be
      // shown in the bottom bar at any width. Read as overflow on the label itself, never as a
      // taller row — every label here is a single word, and a word too long for its box does not
      // wrap to a second line, it slides out of the column with every box still its nominal size.
      // An equal-height check would pass through that silently; this does not. The span sizes to
      // its text while there is room and clamps to what is left when there is not, so the two
      // widths differ exactly when something was cut: measured, "Início" is 35/35 at 272px and
      // 35/29 at 110px.
      for (const row of rows) {
        const label = row.lastElementChild as HTMLElement
        expect(label.scrollWidth, `"${label.textContent}" does not fit`).toBeLessThanOrEqual(
          label.clientWidth,
        )
      }
    })

    await step('the two account actions clear the same floor', async () => {
      // They are targets like any other and sit at the ends of the column, where a thumb is least
      // accurate. "Add a child" and "Sign out" are buttons, not links, so the nav query misses them.
      for (const name of ['Adicionar Filho', 'Conta e preferências']) {
        const button = canvas.getByRole('button', { name })
        expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(FLOOR)
      }
    })
  },
}

export const Account: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(body.getByRole('button', { name: 'Conta e preferências' }))
    await waitFor(() => expect(body.getByRole('button', { name: 'Sair da conta' })).toBeVisible())
  },
}
export const Dark: Story = { globals: { theme: 'dark' } }
export const Desktop: Story = { args: { showAccount: false } }
