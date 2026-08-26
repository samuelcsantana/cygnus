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
                  isCompleted || isActive ? cn(accentClassName, 'text-white') : 'bg-muted text-ink-faint',
                )}
              >
                {isCompleted ? <CheckIcon className="h-3 w-3" /> : index + 1}
              </span>
              {/* Rótulo escondido só visualmente abaixo de `sm`, nunca
                  removido. Os três rótulos somados dão ~420px de min-content, e
                  como DialogContent é um grid cujo item não encolhe abaixo
                  disso (`min-width: auto`), o painel inteiro era arrastado para
                  420 dentro de uma tela de 390 — rolagem horizontal dentro do
                  diálogo. `sr-only` preserva o texto para leitor de tela, e o
                  passo atual continua nomeado no corpo do diálogo. */}
              <span
                className={cn(
                  'sr-only text-xs font-semibold sm:not-sr-only',
                  isActive ? 'text-ink' : 'text-ink-faint',
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-0.5 w-7 flex-shrink-0 rounded-full transition-colors duration-200',
                  isCompleted ? accentClassName : 'bg-muted',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
