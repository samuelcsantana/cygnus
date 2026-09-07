import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTheme } from '@/hooks/useTheme'
import { renderWithProviders, screen } from '@/test/test-utils'

import { ThemeProvider } from './ThemeProvider'

function ThemeControls() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  return <button onClick={() => setTheme('light')}>{theme}:{resolvedTheme}</button>
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.documentElement.classList.remove('dark')
})

describe('ThemeProvider with unavailable storage', () => {
  it('mounts with the system theme when storage access throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage blocked', 'SecurityError')
    })
    renderWithProviders(<ThemeProvider><ThemeControls /></ThemeProvider>)
    expect(screen.getByRole('button', { name: 'system:dark' })).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('dark')
  })

  it('changes the active theme even when saving the preference fails', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('dark')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage full', 'QuotaExceededError')
    })
    renderWithProviders(<ThemeProvider><ThemeControls /></ThemeProvider>)
    await userEvent.click(screen.getByRole('button', { name: 'dark:dark' }))
    expect(screen.getByRole('button', { name: 'light:light' })).toBeInTheDocument()
    expect(document.documentElement).not.toHaveClass('dark')
  })
})
