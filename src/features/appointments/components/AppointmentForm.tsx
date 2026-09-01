import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

import { appointmentFormSchema, type AppointmentFormInput } from '../api/appointments.schemas'
import { AppointmentProfessionalFields } from './AppointmentProfessionalFields'
import { AppointmentScheduleFields } from './AppointmentScheduleFields'

interface AppointmentFormProps {
  defaultValues?: Partial<AppointmentFormInput>
  onSubmit: (values: AppointmentFormInput) => Promise<void>
  submitLabel: string
  onCancel?: () => void
  showCancel?: boolean
}

export function AppointmentForm({ defaultValues, onSubmit, submitLabel, onCancel, showCancel }: AppointmentFormProps) {
  const { t } = useTranslation()
  const [submitError, setSubmitError] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormInput>({
    resolver: zodResolver(appointmentFormSchema),
    // Booking is the default act; recording the past is the deliberate one. A
    // caller can still override it — the reschedule flow passes its own values.
    defaultValues: { status: 'SCHEDULED', ...defaultValues },
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
      <AppointmentProfessionalFields register={register} control={control} errors={errors} />
      <AppointmentScheduleFields register={register} control={control} errors={errors} />

      {submitError && (
        <p role="alert" className="text-destructive text-sm">
          {t('appointments.form.genericError')}
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
