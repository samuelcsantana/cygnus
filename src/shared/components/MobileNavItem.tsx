import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

interface MobileNavItemProps {
  to: string
  icon: ReactNode
  label: string
  disabled?: boolean
  badge?: number
}

export function MobileNavItem({ to, icon, label, disabled, badge }: MobileNavItemProps) {
  const baseClass = 'flex w-16 flex-col items-center justify-center rounded-2xl p-2 transition-all duration-300'

  if (disabled) {
    return (
      <span className={cn(baseClass, 'cursor-not-allowed text-ink-faint')} aria-disabled="true">
        <span className="mb-1 h-6 w-6">{icon}</span>
        <span className="text-[10px] font-bold">{label}</span>
      </span>
    )
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(baseClass, isActive ? 'bg-primary text-primary-foreground' : 'text-ink-muted hover:text-ink-muted')
      }
    >
      <span className="relative mb-1 h-6 w-6">
        {icon}
        {!!badge && (
          <span className="absolute -top-1 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className="text-[10px] font-bold">{label}</span>
    </NavLink>
  )
}
