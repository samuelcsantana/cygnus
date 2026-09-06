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
  // `flex-1 min-w-0` with a 64px ceiling, not a fixed 64px width.
  //
  // At six items the bar ran off the screen at 320px: the targets summed to 342px plus the
  // padding and the last one ended at 350px — off screen, measured. A fixed width gives the
  // browser nothing to divide; `flex-1` divides, and `min-w-0` is what lets the label truncate
  // instead of the text imposing a minimum width. At seven items and 320px each target is
  // ~45px, which is the whole margin over the 44px floor — the bar's own padding was halved to
  // buy it (see MobileNavBar).
  //
  // No horizontal padding here, and it is not the same lever as the bar's. The targets are
  // `flex-1`, so this padding cannot change how wide they are — it only decides how much of
  // each one the label may use. Giving it all to the label is what keeps every label whole at
  // 360px and 390px with seven items; at `px-1` "Consultas" and "Remédios" truncate at every
  // width. The icon and the label are centred, so nothing else moves.
  const baseClass =
    'flex max-w-16 min-w-0 flex-1 flex-col items-center justify-center rounded-2xl py-2 transition-all duration-300'

  if (disabled) {
    return (
      <span className={cn(baseClass, 'cursor-not-allowed text-ink-faint')} aria-disabled="true">
        <span className="mb-1 h-6 w-6">{icon}</span>
        <span className="w-full truncate text-center text-[10px] font-bold">{label}</span>
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
      <span className="w-full truncate text-center text-[10px] font-bold">{label}</span>
    </NavLink>
  )
}
