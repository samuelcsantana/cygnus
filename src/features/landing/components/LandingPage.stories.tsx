import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { ThemeProvider } from '@/app/providers/ThemeProvider'

import { LandingPage } from './LandingPage'

const meta = {
  title: 'Features/Landing/LandingPage',
  component: LandingPage,
  // `null`: Storybook does not serve /embed/embed.js, so the widget box stays
  // empty here rather than showing a drawing of the widget (see ScheduleWidgetShowcase).
  args: { widgetScriptSrc: null },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'What `/` shows a visitor with no session: the product before any form. The calendar box is the real ' +
          'embed widget in the app; in Storybook it stays empty, because the widget is a separate build.',
      },
    },
  },
  decorators: [
    // The header's theme button reads ThemeProvider, which the global decorators do not supply.
    // The style turns the page's motion off (landing.css): the a11y gate runs axe right after
    // render, and text caught mid-rise is half-transparent, which axe reports as low contrast —
    // the same reason e2e/landing.spec.ts emulates reduced motion. Scoped to this page, not global.
    (Story) => (
      <ThemeProvider>
        <style>{'.landing, .landing * { animation: none !important; }'}</style>
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof LandingPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('one page, one h1, and every part in a landmark', async () => {
      await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Vacinas, consultas e crescimento dos seus filhos, num lugar só.',
      )
      await expect(canvas.getByRole('banner')).toBeVisible()
      await expect(canvas.getByRole('main')).toBeVisible()
      await expect(canvas.getByRole('contentinfo')).toBeVisible()
      await expect(canvas.getByRole('complementary', { name: 'Sobre este projeto' })).toBeVisible()
    })

    await step('the ways in: the demo first, sign-in beside it', async () => {
      await expect(canvas.getAllByRole('button', { name: 'Ver demonstração' }).length).toBeGreaterThan(0)
      await expect(canvas.getAllByRole('link', { name: 'Entrar' })[0]).toHaveAttribute('href', '/login')
    })

    await step('the code links open the public repositories', async () => {
      await expect(canvas.getByRole('link', { name: /Código da API/ })).toHaveAttribute(
        'href',
        'https://github.com/samuelcsantana/cygnus-api',
      )
    })
  },
}

/** The page a recruiter from abroad gets: the browser's language is detected, and PT · EN · ES stay one click away. */
export const English: Story = {
  globals: { locale: 'en' },
}
