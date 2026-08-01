import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

interface NavItemProps {
  to: string
  icon: ReactNode
  label: string
  disabled?: boolean
}

export function NavItem({ to, icon, label, disabled }: NavItemProps) {
  const baseClass =
    'group flex w-full items-center rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300'

  if (disabled) {
    return (
      <span className={cn(baseClass, 'cursor-not-allowed text-slate-300')} aria-disabled="true">
        <span className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-300">
          {icon}
        </span>
        {label}
      </span>
    )
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(baseClass, isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'mr-3 flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
              isActive
                ? 'border border-teal-100 bg-white text-teal-600 shadow-sm'
                : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600 group-hover:shadow-sm',
            )}
          >
            {icon}
          </span>
          {label}
        </>
      )}
    </NavLink>
  )
}
