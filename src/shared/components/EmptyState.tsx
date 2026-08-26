import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type EmptyStateTone = 'slate' | 'emerald' | 'violet' | 'amber' | 'rose'

const TONE_CLASSES: Record<EmptyStateTone, string> = {
  slate: 'bg-muted text-ink-faint',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  violet: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300',
  // amber-600 on amber-50 is 2.93:1 — under the 3:1 floor icons owe as
  // non-text content. The other tones already clear it.
  amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  rose: 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-300',
}

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  /** Matches the section's accent color from the per-feature accent map. Defaults to neutral. */
  tone?: EmptyStateTone
}

export function EmptyState({ icon, title, description, action, tone = 'slate' }: EmptyStateProps) {
  return (
    <div className="rounded-[2rem] border border-border bg-card p-12 text-center shadow-sm">
      <div className={cn('mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full', TONE_CLASSES[tone])}>
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-bold text-ink">{title}</h3>
      <p className="mx-auto mb-8 max-w-md text-ink-muted">{description}</p>
      {action}
    </div>
  )
}
