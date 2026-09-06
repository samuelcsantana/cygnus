import type { ReactNode } from 'react'

import { MobileNavItem } from './MobileNavItem'

interface MobileNavBarItem {
  to: string
  label: string
  icon: ReactNode
  disabled?: boolean
  badge?: number
}

interface MobileNavBarProps {
  items: MobileNavBarItem[]
}

/**
 * The bottom bar. **Where it applies is the shell's decision, not this
 * component's** — the shell wraps it in `md:hidden`, next to the two headers it
 * already switches between at the same breakpoint. Keeping the media query out
 * of here is what lets the story render it at all: a `display: none` element
 * has no boxes to measure, and the measurement is why this was pulled out of
 * the shell in the first place. See `MobileNavBar.stories.tsx`, which asserts
 * the 44px target floor.
 *
 * `px-1`, and it was `p-2` until the seventh item arrived. The targets are
 * `flex-1`, so each one measures `(width − this padding) / items`: at seven
 * items `p-2` leaves 43.4px at 320px, under the 44px floor (WCAG 2.5.5, AAA)
 * the bar cleared with six. Giving those 8px back to the division restores it.
 * Halving rather than removing the padding keeps the active pill off the screen
 * edge, and the margin it leaves is thin on purpose: an eighth item is out of
 * reach at any padding — 39px even at zero — so the next thing that wants a tab
 * needs a different navigation, not another 8px.
 */
export function MobileNavBar({ items }: MobileNavBarProps) {
  return (
    <nav className="pb-safe print:hidden fixed right-0 bottom-0 left-0 z-30 flex justify-around border-t border-border bg-card/90 px-1 py-2 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] backdrop-blur-md">
      {items.map((item) => (
        <MobileNavItem key={item.to} {...item} />
      ))}
    </nav>
  )
}
