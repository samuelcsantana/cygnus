import { createContext } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeContextValue {
  /** The user's stored preference — may be 'system'. */
  theme: ThemeMode
  /** The actual light/dark value currently applied to the document. */
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
