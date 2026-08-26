import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

import { createMilestoneFormSchema, type MilestoneFormInput } from '../api/milestones.schemas'
import { MilestoneCoreFields } from './MilestoneCoreFields'
import { MilestoneDetailFields } from './MilestoneDetailFields'

interface MilestoneFormProps {
  birthDate: string
  defaultValues?: Partial<MilestoneFormInput>
  onSubmit: (values: MilestoneFormInput) => Promise<void>
  submitLabel: string
  onCancel?: () => void
  showCancel?: boolean
}

export function MilestoneForm({
  birthDate,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
  showCancel,
}: MilestoneFormProps) {
  const { t } = useTranslation()
  const [submitError, setSubmitError] = useState(false)
  const schema = useMemo(() => createMilestoneFormSchema(birthDate), [birthDate])

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MilestoneFormInput>({
    resolver: zodResolver(schema),
    defaultValues: { photoUrl: '', ...defaultValues },
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
    <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
      <MilestoneCoreFields control={control} register={register} errors={errors} />
      <MilestoneDetailFields register={register} control={control} errors={errors} />

      {submitError && (
        <p role="alert" className="text-destructive text-sm">
          {t('milestones.form.genericError')}
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
        <Button type="submit" disabled={isSubmitting} className="bg-foreground text-background hover:bg-foreground/90">
          {isSubmitting ? t('common.saving') : submitLabel}
        </Button>
      </div>
    </form>
  )
}
