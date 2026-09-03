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
            substitui um deles quando a consulta falhou. Saiu do `font-display`
            para a mono, e de `font-extrabold` para o peso 400 que está
            carregado: a 18px numa mono, o desenho já tem presença suficiente,
            e um 800 aqui seria sintetizado.

            Efeito colateral desejado: as quatro datas dos cartões da linha
            passam a ter a mesma largura, então os quatro valores alinham entre
            si em vez de cada um começar onde a proporcional o deixou. */}
        <p className="font-mono mb-0.5 text-lg text-ink">{value}</p>
        <p className="text-xs text-ink-muted">{sub}</p>
      </div>
    </div>
  )
}
