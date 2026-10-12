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
          'Two treatments of one control. `compact` is the public-screen header: ' +
          'the three codes side by side, PT · EN · ES, so the language a visitor ' +
          'from abroad needs is on screen without opening anything. `field` is the ' +
          'settings form: the same 44px tinted input the auth screens use, with ' +
          'each language listed in its own language.',
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
 * How it appears on the public screens: beside the theme button, same height.
 *
 * ThemeToggle calls useTheme(), which throws outside a ThemeProvider — the
 * global decorators in .storybook/preview.tsx supply i18n, Query and a router,
 * but not that one. Wrapped here rather than added globally, because this is
 * the only story that needs it.
 *
 * The `play` flips the theme and back. The button shows where a click goes —
 * a moon on the light page, a sun on the dark one — so its name is what the
 * step checks, and it ends light so the stored preference does not leak into
 * the next story.
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('the theme button offers the other theme, and flips back', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Mudar para o tema escuro' }))
      await waitFor(() => expect(document.documentElement).toHaveClass('dark'))
      await userEvent.click(canvas.getByRole('button', { name: 'Mudar para o tema claro' }))
      await waitFor(() => expect(document.documentElement).not.toHaveClass('dark'))
      await expect(canvas.getByRole('button', { name: 'Mudar para o tema escuro' })).toBeVisible()
    })
  },
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
 * The compact control is three toggle buttons in a named group; the pressed one
 * is the language on screen, and `<html lang>` follows it.
 */
export const SwitchingLanguage: Story = {
  name: 'Interaction — switching language',
  args: { variant: 'compact' },
  play: async ({ canvasElement, step }) => {
    const group = within(canvasElement).getByRole('group', { name: 'Idioma' })

    await step('all three are on screen, the current one pressed', async () => {
      await expect(within(group).getByRole('button', { name: 'PT (Português)' })).toHaveAttribute('aria-pressed', 'true')
      await expect(within(group).getByRole('button', { name: 'EN (English)' })).toHaveAttribute('aria-pressed', 'false')
      await expect(within(group).getByRole('button', { name: 'ES (Español)' })).toHaveAttribute('aria-pressed', 'false')
    })

    await step('choosing one switches the language and the document', async () => {
      await userEvent.click(within(group).getByRole('button', { name: 'EN (English)' }))
      // The group's own name is translated too, so it is found again in English.
      await waitFor(() =>
        expect(
          within(within(canvasElement).getByRole('group', { name: 'Language' })).getByRole('button', { name: 'EN (English)' }),
        ).toHaveAttribute('aria-pressed', 'true'),
      )
      await expect(document.documentElement).toHaveAttribute('lang', 'en')
    })
  },
}

/**
 * The settings form keeps the menu, and the menu is the only state where the
 * three languages and the checked row are on screen, so it gets a `play`.
 *
 * It ends by committing a choice, which is not just extra coverage: while a
 * Radix Select is open it marks the rest of the page — its own trigger
 * included — `aria-hidden` while that trigger keeps focus, and axe reports
 * that as `aria-hidden-focus`. Since the a11y gate runs after `play`, a story
 * that leaves the menu open fails on the primitive's own behaviour. Closing it
 * by selecting is the pattern `select.stories.tsx` already uses.
 */
export const SwitchingLanguageInSettings: Story = {
  name: 'Interaction — switching language in settings',
  args: { variant: 'field' },
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
