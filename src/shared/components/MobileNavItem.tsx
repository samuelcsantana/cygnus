import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

interface MobileNavItemProps {
  to: string
  icon: ReactNode
  label: string
  disabled?: boolean
}

export function MobileNavItem({ to, icon, label, disabled }: MobileNavItemProps) {
  const baseClass = 'flex w-16 flex-col items-center justify-center rounded-2xl p-2 transition-all duration-300'

  if (disabled) {
    return (
      <span className={cn(baseClass, 'cursor-not-allowed text-slate-300')} aria-disabled="true">
        <span className="mb-1 h-6 w-6">{icon}</span>
        <span className="text-[10px] font-bold">{label}</span>
      </span>
    )
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(baseClass, isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:text-slate-600')
      }
    >
      <span className="mb-1 h-6 w-6">{icon}</span>
      <span className="text-[10px] font-bold">{label}</span>
    </NavLink>
  )
}
