import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

import { babyFormSchema, type BabyFormInput } from '../api/babies.schemas'
import { BabyHealthFields } from './BabyHealthFields'
import { BabyProfileFields } from './BabyProfileFields'

interface BabyFormProps {
  defaultValues?: Partial<BabyFormInput>
  onSubmit: (values: BabyFormInput) => Promise<void>
  submitLabel: string
  onCancel?: () => void
  showCancel?: boolean
  /** Rendered below the health fields — used to surface a danger-zone action alongside the form. */
  dangerZone?: ReactNode
}

export function BabyForm({ defaultValues, onSubmit, submitLabel, onCancel, showCancel, dangerZone }: BabyFormProps) {
  const { t } = useTranslation()
  const [submitError, setSubmitError] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BabyFormInput>({
    resolver: zodResolver(babyFormSchema),
    defaultValues: {
      allergies: [],
      healthPlanName: '',
      healthPlanNumber: '',
      avatarUrl: '',
      avatarColor: '',
      ...defaultValues,
    },
  })

  const handleFormSubmit = handleSubmit(async (values) => {
    setSubmitError(false)
    try {
      await onSubmit(values)
    } catch {
      setSubmitError(true)
    }
  })

  return (
    <form onSubmit={handleFormSubmit} className="relative z-10" noValidate>
      {/* Duas colunas para os **campos**, e os cartões abaixo ocupando a largura toda.
          
          Antes o `dangerZone` (responsáveis, profissionais, zona de perigo) ficava dentro da coluna
          da direita, o que produzia duas coisas ruins ao mesmo tempo: um vazio enorme embaixo da
          coluna da esquerda, que acaba no "Sexo", e cartões espremidos em meia largura, onde o
          cabeçalho de cada um (ícone + título + descrição + botão) quebrava em quatro linhas.
          Cartão é bloco, não campo — e bloco não divide coluna com formulário. */}
      <div className="grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-2">
        <BabyProfileFields register={register} control={control} errors={errors} />
        <BabyHealthFields control={control} />
      </div>

      {dangerZone && <div className="mt-8 space-y-5">{dangerZone}</div>}

      {submitError && (
        <p role="alert" className="text-destructive mt-6 text-sm">
          {t('babies.form.genericError')}
        </p>
      )}

      <div className="mt-6 flex items-center justify-end gap-4 border-t border-border pt-6">
        {showCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3.5 text-sm font-bold text-ink-muted transition-colors hover:text-ink"
          >
            {t('common.cancel')}
          </button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.saving') : submitLabel}
        </Button>
      </div>
    </form>
  )
}
