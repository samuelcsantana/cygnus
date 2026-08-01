import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'

import i18n from '@/lib/i18n'

// jsdom's default navigator.language ("en-US") gets picked up by
// i18next-browser-languagedetector, overriding fallbackLng — pin pt-BR so
// component tests asserting on translated text are deterministic.
void i18n.changeLanguage('pt-BR')

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
    </I18nextProvider>
  )
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
