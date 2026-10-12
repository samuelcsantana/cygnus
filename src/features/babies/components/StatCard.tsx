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
        {/* O valor é sempre dado — uma contagem, uma data, ou o travessão que
            substitui um deles quando a consulta falhou. Algarismos tabulares:
            as quatro datas dos cartões da linha têm a mesma largura e alinham
            entre si, em vez de cada uma começar onde a proporcional a deixou. */}
        <p className="font-sans tabular-nums mb-0.5 text-lg text-ink">{value}</p>
        <p className="text-xs text-ink-muted">{sub}</p>
      </div>
    </div>
  )
}
