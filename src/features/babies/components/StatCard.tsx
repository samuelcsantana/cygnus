import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string
  sub: string
  iconClassName: string
}

export function StatCard({ icon, label, value, sub, iconClassName }: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconClassName)}>{icon}</div>
      <div>
        <p className="mb-0.5 text-[11px] font-semibold tracking-wide text-ink-muted uppercase">{label}</p>
        <p className="font-display mb-0.5 text-lg font-extrabold text-ink">{value}</p>
        <p className="text-xs text-ink-muted">{sub}</p>
      </div>
    </div>
  )
}
