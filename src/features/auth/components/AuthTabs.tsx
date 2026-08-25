import { useTranslation } from 'react-i18next'
import { NavLink, useMatch } from 'react-router-dom'

import { cn } from '@/lib/utils'

const SEGMENT_CLASS =
  'relative z-10 flex h-9 items-center justify-center rounded-[10px] text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none'

/**
 * The segmented control at the top of both auth screens.
 *
 * These are links, not tabs: each one changes the URL and mounts a different
 * route, so `role="tablist"` would promise a panel swap that never happens and
 * would strand keyboard users on arrow keys that do nothing. NavLink already
 * marks the current one with aria-current="page", which is what a screen reader
 * needs to announce here.
 *
 * The white pill is one element that slides, rather than a background that
 * appears on whichever link is active. That only became possible once
 * router.tsx made AuthLayout the parent route of both screens: while each route
 * rendered its own copy of the shell, this <nav> was destroyed and rebuilt on
 * every switch, and a transition has nothing to animate from on a fresh node.
 */
export function AuthTabs() {
  const { t } = useTranslation()
  const isLogin = useMatch('/login') !== null

  const segments = [
    { to: '/register', label: t('auth.tabs.register') },
    { to: '/login', label: t('auth.tabs.login') },
  ]

  return (
    // Two links in a grid rather than a <ul>: the list would need
    // `display: contents` on each <li> to let the grid lay the links out, and
    // that is exactly the pattern that drops list semantics from the
    // accessibility tree in some engines. A <nav> with two links needs no list.
    <nav
      aria-label={t('auth.tabs.label')}
      className="relative grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted p-1"
    >
      {/* Geometry, so the two halves stay flush as the card width changes: the
          nav carries 4px of padding and a 4px gap, so each segment is
          `50% - 6px` of the nav, and the travel to the second slot is the
          pill's own width plus that gap. Decorative — the links below carry
          the label, the state and the focus ring. */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-1 left-1 w-[calc(50%-6px)] rounded-[10px] bg-card shadow-sm transition-transform duration-200 ease-out',
          isLogin && 'translate-x-[calc(100%+4px)]',
        )}
      />

      {segments.map((segment) => (
        <NavLink
          key={segment.to}
          to={segment.to}
          className={({ isActive }) => cn(SEGMENT_CLASS, isActive ? 'text-ink' : 'text-ink-muted hover:text-ink')}
        >
          {segment.label}
        </NavLink>
      ))}
    </nav>
  )
}
