import { withThemeByClassName } from '@storybook/addon-themes'
import type { Preview, Decorator } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'

import { Toaster } from '../src/components/ui/sonner'
import i18n from '../src/lib/i18n'

import '../src/index.css'

interface DecoratorProps {
  children: ReactNode
}

/**
 * Drives the app's real i18next instance from the toolbar's `locale` global, so
 * every story can be inspected in all three shipped locales. Components must
 * never hardcode user-facing text (see AGENTS.md §8) — switching the locale here
 * is how that rule gets verified visually.
 */
function I18nDecorator({ locale, children }: DecoratorProps & { locale: string }) {
  useEffect(() => {
    void i18n.changeLanguage(locale)
  }, [locale])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

/**
 * A throwaway QueryClient per story, so a story that mocks a failing request
 * can't poison the cache of the next one. Retries are off: in a story, a
 * "loading forever" state is a bug to see, not to wait out.
 */
function QueryDecorator({ children }: DecoratorProps) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: Infinity },
          mutations: { retry: false },
        },
      }),
  )

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const withAppProviders: Decorator = (Story, context) => (
  <I18nDecorator locale={context.globals.locale as string}>
    <QueryDecorator>
      <MemoryRouter>
        <Story />
        <Toaster />
      </MemoryRouter>
    </QueryDecorator>
  </I18nDecorator>
)

const preview: Preview = {
  // Every story gets an auto-generated docs page built from its prop types.
  tags: ['autodocs'],

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // `test: 'error'` makes an axe violation fail the story rather than sit in a
    // panel nobody opens. Accessibility is a build result here, not a suggestion.
    a11y: {
      test: 'error',
    },

    options: {
      storySort: {
        order: ['Design System', ['Introduction', 'Design Tokens'], 'UI', 'Shared', 'Features'],
      },
    },
  },

  globalTypes: {
    locale: {
      description: 'Active locale',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'pt-BR', title: 'Português (BR)' },
          { value: 'en', title: 'English' },
          { value: 'es', title: 'Español' },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    locale: 'pt-BR',
  },

  decorators: [
    withAppProviders,
    // Mirrors ThemeProvider's real mechanism: toggling `.dark` on <html>.
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),
  ],
}

export default preview
