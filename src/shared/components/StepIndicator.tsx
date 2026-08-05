import { cn } from '@/lib/utils'
import { CheckIcon } from '@/shared/icons/check-icon'

export interface Step {
  id: string
  label: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStepId: string
  accentClassName?: string
  className?: string
}

export function StepIndicator({ steps, currentStepId, accentClassName = 'bg-primary', className }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStepId)

  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isActive = index === currentIndex

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors duration-200',
                  isCompleted || isActive ? cn(accentClassName, 'text-white') : 'bg-slate-100 text-ink-faint',
                )}
              >
                {isCompleted ? <CheckIcon className="h-3 w-3" /> : index + 1}
              </span>
              <span className={cn('text-xs font-semibold', isActive ? 'text-ink' : 'text-ink-faint')}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-0.5 w-7 flex-shrink-0 rounded-full transition-colors duration-200',
                  isCompleted ? accentClassName : 'bg-slate-100',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
