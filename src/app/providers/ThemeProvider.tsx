import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  /** The user's stored preference — may be 'system'. */
  theme: ThemeMode
  /** The actual light/dark value currently applied to the document. */
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
const STORAGE_KEY = 'theme'
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

function getSystemPreference(): ResolvedTheme {
  return window.matchMedia(DARK_MEDIA_QUERY).matches ? 'dark' : 'light'
}

function readStoredTheme(): ThemeMode {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

function resolveTheme(theme: ThemeMode): ResolvedTheme {
  return theme === 'system' ? getSystemPreference() : theme
}

function applyResolvedTheme(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

interface ThemeProviderProps {
  children: ReactNode
}

// Applies/removes Tailwind's `.dark` class on <html> based on a persisted
// 'light' | 'dark' | 'system' preference (localStorage key: 'theme'),
// falling back to the OS-level prefers-color-scheme when set to 'system'
// (and reacting live to OS-level changes while in that mode).
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(theme))

  useEffect(() => {
    const resolved = resolveTheme(theme)
    setResolvedTheme(resolved)
    applyResolvedTheme(resolved)

    if (theme !== 'system') return

    const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY)
    const handleChange = () => {
      const nextResolved = getSystemPreference()
      setResolvedTheme(nextResolved)
      applyResolvedTheme(nextResolved)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = (next: ThemeMode) => {
    setThemeState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
