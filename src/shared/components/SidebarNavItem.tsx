import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

interface SidebarNavItemProps {
  to: string
  icon: ReactNode
  label: string
  disabled?: boolean
  onNavigate?: () => void
}

/**
 * A row in the side menu — icon, then label, on one line.
 *
 * The vertical list is what buys the full label back. In the bottom bar the
 * label lived inside a target of `(width − padding) / items`, which is why
 * "Profissionais" (~90px) could never be shown there at any width and the tab
 * had to read "Equipe". Here the width is the sidebar's, the same for every
 * item, and the only shared budget is vertical — where a seventh item costs
 * 44px of a column that scrolls.
 *
 * `min-h-11` is the 44px target floor (WCAG 2.5.5, AAA) stated as a property of
 * the row rather than as arithmetic on the container, because nothing divides
 * anything here. `AppSidebar.stories.tsx` measures it in a real browser, along
 * with the equal-height assertion that proves no label wrapped.
 *
 * `min-w-0` on the label is what makes a label that does not fit *measurable*.
 * A flex child defaults to `min-width: auto`, which lets the text impose its own
 * width and spill out of the column with every box still reporting its nominal
 * size — the story then measures a sidebar whose labels are outside it and
 * passes. With `min-w-0` the span clamps to the space left, so its content width
 * exceeds its box and the gate has something to read.
 *
 * Active state is the same filled pill the top nav used, not the reference's
 * 3px amber rule: the app has exactly one way of saying "you are here" and a
 * second one would be a token to keep in contrast forever. The pill is already
 * measured in both themes.
 */
export function SidebarNavItem({ to, icon, label, disabled, onNavigate }: SidebarNavItemProps) {
  const baseClass =
    'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors'

  if (disabled) {
    return (
      <span className={cn(baseClass, 'cursor-not-allowed text-ink-faint')} aria-disabled="true">
        <span className="flex-shrink-0">{icon}</span>
        <span className="min-w-0">{label}</span>
      </span>
    )
  }

  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          baseClass,
          isActive
            ? 'bg-emerald-50 text-emerald-900 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800'
            : 'text-ink-muted hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300',
        )
      }
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="min-w-0">{label}</span>
    </NavLink>
  )
}
