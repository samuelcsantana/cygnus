import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

interface NavItemProps {
  to: string
  icon: ReactNode
  label: string
  disabled?: boolean
  badge?: number
}

export function NavItem({ to, icon, label, disabled, badge }: NavItemProps) {
  const baseClass = 'flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-sm font-semibold transition-all'

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
        cn(
          baseClass,
          isActive ? 'bg-primary text-white' : 'text-ink-muted hover:bg-teal-50 hover:text-teal-700',
        )
      }
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {!!badge && (
        <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </NavLink>
  )
}
