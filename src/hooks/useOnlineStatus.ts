import { useEffect, useState } from 'react'

/**
 * Tracks `navigator.onLine`, updated live via the `online`/`offline` window
 * events. `navigator.onLine` only reflects whether the device has a network
 * interface with a connection at all (not whether the API is actually
 * reachable), but it's still a useful, zero-cost signal for "you're clearly
 * disconnected" banners.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
