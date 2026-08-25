import type { ReactNode } from 'react'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

export interface SelectorCardOption {
  value: string
  label: ReactNode
  description?: ReactNode
  media?: ReactNode
}

interface SelectorCardGroupProps {
  value: string | undefined
  onValueChange: (value: string) => void
  options: SelectorCardOption[]
  name?: string
  className?: string
  layout?: 'horizontal' | 'vertical'
}

export function SelectorCardGroup({
  value,
  onValueChange,
  options,
  name,
  className,
  layout = 'horizontal',
}: SelectorCardGroupProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onValueChange}
      name={name}
      className={cn(layout === 'vertical' ? 'flex flex-col gap-3' : 'grid grid-cols-2 gap-3 sm:grid-cols-3', className)}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'has-data-checked:border-primary has-data-checked:bg-primary/5 flex cursor-pointer rounded-2xl border-2 border-border transition-all hover:border-border',
            layout === 'vertical' ? 'items-start gap-3.5 p-4' : 'items-center gap-3 p-3',
          )}
        >
          <RadioGroupItem value={option.value} className={layout === 'vertical' ? 'mt-1' : undefined} />
          {option.media}
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-ink-muted">{option.label}</span>
            {layout === 'vertical' && option.description && (
              <span className="mt-0.5 block text-xs font-normal text-ink-muted/80">{option.description}</span>
            )}
          </span>
        </label>
      ))}
    </RadioGroup>
  )
}
