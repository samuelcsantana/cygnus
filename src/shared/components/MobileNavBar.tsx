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
 * has no boxes to measure, and measuring is the reason this was pulled out of
 * the shell. See `MobileNavBar.stories.tsx`.
 *
 * What there is to measure: the items are `flex-1`, so each target measures
 * `(bar width − this padding) / items`. That arithmetic is the only thing
 * standing between the bar and a target under the 44px floor (WCAG 2.5.5,
 * AAA), it moves whenever an item or a padding class does, and until now it
 * lived in a shell nothing could render without a session.
 */
export function MobileNavBar({ items }: MobileNavBarProps) {
  return (
    <nav className="pb-safe print:hidden fixed right-0 bottom-0 left-0 z-30 flex justify-around border-t border-border bg-card/90 p-2 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] backdrop-blur-md">
      {items.map((item) => (
        <MobileNavItem key={item.to} {...item} />
      ))}
    </nav>
  )
}
