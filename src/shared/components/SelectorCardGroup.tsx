import type { ReactNode } from 'react'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

export interface SelectorCardOption {
  value: string
  label: ReactNode
  media?: ReactNode
}

interface SelectorCardGroupProps {
  value: string | undefined
  onValueChange: (value: string) => void
  options: SelectorCardOption[]
  name?: string
  className?: string
}

export function SelectorCardGroup({ value, onValueChange, options, name, className }: SelectorCardGroupProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onValueChange}
      name={name}
      className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3', className)}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className="has-data-checked:border-primary has-data-checked:bg-primary/5 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-slate-100 p-3 transition-all hover:border-slate-200"
        >
          <RadioGroupItem value={option.value} />
          {option.media}
          <span className="truncate text-sm font-bold text-slate-700">{option.label}</span>
        </label>
      ))}
    </RadioGroup>
  )
}
