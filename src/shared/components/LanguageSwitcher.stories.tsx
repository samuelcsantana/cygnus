import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { ThemeProvider } from '@/app/providers/ThemeProvider'

import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'

const meta = {
  title: 'Shared/LanguageSwitcher',
  component: LanguageSwitcher,
  parameters: {
    docs: {
      description: {
        component:
          'Two treatments of one control. `compact` is the header/auth-screen ' +
          'form — ghost, 36px, shaped to pair with ThemeToggle, and it drops to ' +
          'the two-letter code below `sm`. `field` is the settings form: the same ' +
          '44px tinted input the auth screens use. Each language is listed in its ' +
          'own language, which is why the labels are not translated.',
      },
    },
  },
} satisfies Meta<typeof LanguageSwitcher>

export default meta
type Story = StoryObj<typeof meta>

export const Compact: Story = {
  args: { variant: 'compact' },
}

/**
 * How it actually appears in the app: beside the theme toggle, same height and
 * radius. The whole point of the compact treatment is that the two read as one
 * pair, so it is worth a story rather than a claim in a comment.
 *
 * ThemeToggle calls useTheme(), which throws outside a ThemeProvider — the
 * global decorators in .storybook/preview.tsx supply i18n, Query and a router,
 * but not that one. Wrapped here rather than added globally, because this is
 * the only story that needs it.
 */
export const PairedWithThemeToggle: Story = {
  args: { variant: 'compact' },
  render: (args) => (
    <ThemeProvider>
      <div className="flex items-center justify-end gap-1.5">
        <ThemeToggle />
        <LanguageSwitcher {...args} />
      </div>
    </ThemeProvider>
  ),
}

export const Field: Story = {
  args: { variant: 'field' },
  render: (args) => (
    <div className="w-full max-w-xs">
      <LanguageSwitcher {...args} />
    </div>
  ),
}

/**
 * The menu is the only state where the three languages and the checked row are
 * on screen, so it gets a `play` rather than a screenshot.
 *
 * It ends by committing a choice, which is not just extra coverage: while a
 * Radix Select is open it marks the rest of the page — its own trigger
 * included — `aria-hidden` while that trigger keeps focus, and axe reports
 * that as `aria-hidden-focus`. Since the a11y gate runs after `play`, a story
 * that leaves the menu open fails on the primitive's own behaviour. Closing it
 * by selecting is the pattern `select.stories.tsx` already uses.
 */
export const SwitchingLanguage: Story = {
  name: 'Interaction — switching language',
  args: { variant: 'compact' },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('combobox')
    const screen = within(document.body)

    await step('opens with the keyboard alone', async () => {
      trigger.focus()
      await userEvent.keyboard('{Enter}')
      await waitFor(() => expect(screen.getByRole('listbox')).toBeVisible())
    })

    await step('every language is offered, each written in its own language', async () => {
      for (const label of ['Português', 'English', 'Español']) {
        await expect(screen.getByRole('option', { name: label })).toBeVisible()
      }
      // data-state, not aria-selected: Radix ties aria-selected to the
      // *highlighted* option, while data-state="checked" is what it guarantees
      // for the current value — and is the hook the checked styling keys off.
      await expect(screen.getByRole('option', { name: 'Português' })).toHaveAttribute('data-state', 'checked')
      await expect(screen.getByRole('option', { name: 'English' })).toHaveAttribute('data-state', 'unchecked')
    })

    await step('committing a choice closes the menu and updates the trigger', async () => {
      await userEvent.click(screen.getByRole('option', { name: 'English' }))
      await waitFor(() => expect(trigger).toHaveTextContent('English'))
      // Waiting for the trigger text is not enough to finish: the menu plays a
      // close animation, and until it unmounts Radix still has the rest of the
      // page marked aria-hidden — including this focused trigger, which axe
      // then reports as aria-hidden-focus. The gate runs right after `play`,
      // so the story has to wait for the portal to actually go.
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
    })
  },
}
