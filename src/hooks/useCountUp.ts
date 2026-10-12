import { useEffect, useRef, useState } from 'react'

/** True only when the device says motion is welcome; unknown (no matchMedia) counts as no. */
function motionAllowed(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: no-preference)').matches
  )
}

/**
 * A number that counts to its value instead of appearing at it — from zero on
 * first show, and from where it stood when the value changes (a dose
 * registered, the percentage rising from 62 to 64). Option 36 of the redesign:
 * the progress of a vaccine card reads as progress.
 *
 * Integers only, eased out over `durationMs`. Under reduced motion, or where
 * the preference cannot be read, it is simply the value — the number is the
 * information, and the counting is decoration.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const animate = motionAllowed()
  const [shown, setShown] = useState(() => (animate ? 0 : target))
  const current = useRef(shown)

  useEffect(() => {
    if (!animate) return
    const from = current.current
    if (from === target) return

    let frame = 0
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs)
      const eased = 1 - (1 - progress) ** 3
      const next = Math.round(from + (target - from) * eased)
      current.current = next
      setShown(next)
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [animate, target, durationMs])

  return animate ? shown : target
}
