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
  // `flex-1 min-w-0` com teto de 64px, e não largura fixa de 64px.
  //
  // Com seis itens a barra passou a estourar a 320px: os alvos somavam 342px mais o padding, e o
  // último terminava em 350px — fora da tela, medido. Largura fixa não deixa o navegador dividir o
  // que existe; `flex-1` divide, e `min-w-0` é o que permite o rótulo truncar em vez de impor uma
  // largura mínima pelo texto. A 320px cada alvo fica com ~50px, bem acima do piso de 44px.
  const baseClass =
    'flex max-w-16 min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-1 py-2 transition-all duration-300'

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
