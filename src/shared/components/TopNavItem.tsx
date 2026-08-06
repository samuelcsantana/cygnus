import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

interface TopNavItemProps {
  to: string
  icon: ReactNode
  label: string
  disabled?: boolean
  badge?: number
}

// Horizontal-bar counterpart to NavItem's block-row layout — same
// active/disabled/badge semantics, sized as a pill for the desktop top nav.
export function TopNavItem({ to, icon, label, disabled, badge }: TopNavItemProps) {
  const baseClass = 'relative inline-flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all'

  if (disabled) {
    return (
      <span className={cn(baseClass, 'cursor-not-allowed text-ink-faint')} aria-disabled="true">
        <span className="flex-shrink-0">{icon}</span>
        {label}
      </span>
    )
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(baseClass, isActive ? 'bg-primary text-white' : 'text-ink-muted hover:bg-teal-50 hover:text-teal-700')
      }
    >
      <span className="flex-shrink-0">{icon}</span>
      {label}
      {!!badge && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </NavLink>
  )
}
