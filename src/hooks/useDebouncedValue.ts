import { useEffect, useState } from 'react'

/**
 * Debounces a fast-changing value (e.g. a search input) so consumers (a
 * client-side `.filter()`, a future server `?search=` request) only react
 * once the user pauses typing, instead of on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs)
    return () => clearTimeout(timeoutId)
  }, [value, delayMs])

  return debouncedValue
}
