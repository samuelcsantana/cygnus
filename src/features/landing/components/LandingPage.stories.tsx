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
    (Story) => (
      <ThemeProvider>
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

    await step('the ways in lead to sign-up and sign-in', async () => {
      await expect(canvas.getByRole('link', { name: 'Criar conta grátis' })).toHaveAttribute('href', '/register')
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
