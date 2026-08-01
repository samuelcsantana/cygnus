import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders, screen } from '@/test/test-utils'

import { ErrorBoundary } from './ErrorBoundary'

function Bomb(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  it('renders a fallback instead of crashing the whole app', () => {
    // React logs the caught error to the console by default — expected noise here.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderWithProviders(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recarregar página' })).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})
