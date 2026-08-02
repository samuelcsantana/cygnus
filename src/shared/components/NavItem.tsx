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
  const baseClass =
    'group flex w-full items-center rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300'

  if (disabled) {
    return (
      <span className={cn(baseClass, 'cursor-not-allowed text-ink-faint')} aria-disabled="true">
        <span className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-ink-faint">
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
        cn(baseClass, isActive ? 'bg-teal-50 text-teal-700' : 'text-ink-muted hover:bg-slate-50 hover:text-ink')
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'mr-3 flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
              isActive
                ? 'border border-teal-100 bg-white text-teal-600 shadow-sm'
                : 'bg-slate-100 text-ink-faint group-hover:bg-white group-hover:text-ink-muted group-hover:shadow-sm',
            )}
          >
            {icon}
          </span>
          <span className="flex-1">{label}</span>
          {!!badge && (
            <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}
