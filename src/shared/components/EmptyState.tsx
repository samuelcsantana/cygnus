import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-12 text-center shadow-sm">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-slate-300">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mb-8 max-w-md text-slate-500">{description}</p>
      {action}
    </div>
  )
}
