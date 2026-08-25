import { useEffect, useRef, useState } from 'react'

interface SmoothPendingOptions {
  /** How long a request may run before it is worth telling the user about. */
  delay?: number
  /** Once shown, the shortest time the indicator stays up. */
  minDuration?: number
}

/**
 * Smooths a pending flag so a spinner never flashes.
 *
 * Two problems, and each needs one of the two timers. A request that answers in
 * 80ms would otherwise blink the indicator on and straight back off, which
 * reads as a glitch rather than as speed — so nothing is shown for the first
 * `delay`. And a request that answers at `delay + 20ms` would show it for
 * 20ms, which is the same blink one step later — so once it is up it stays for
 * `minDuration`.
 *
 * Return this for what the user sees. Keep `disabled` and `aria-busy` on the
 * real flag: the control has to stop accepting presses the moment the request
 * starts, whatever is on screen.
 */
export function useSmoothPending(isPending: boolean, { delay = 400, minDuration = 400 }: SmoothPendingOptions = {}) {
  const [isVisible, setIsVisible] = useState(false)
  const shownAt = useRef<number | null>(null)

  useEffect(() => {
    if (isPending) {
      if (isVisible) return
      const timer = setTimeout(() => {
        shownAt.current = Date.now()
        setIsVisible(true)
      }, delay)
      return () => clearTimeout(timer)
    }

    if (!isVisible) return
    const elapsed = Date.now() - (shownAt.current ?? Date.now())
    const timer = setTimeout(() => {
      shownAt.current = null
      setIsVisible(false)
    }, Math.max(0, minDuration - elapsed))
    return () => clearTimeout(timer)
  }, [isPending, isVisible, delay, minDuration])

  return isVisible
}
