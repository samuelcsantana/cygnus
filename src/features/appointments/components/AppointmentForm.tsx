import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import { appointmentFormSchema, type AppointmentFormInput } from '../api/appointments.schemas'

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
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormInput>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues,
  })

  const handleFormSubmit = handleSubmit(async (values) => {
    setSubmitError(false)
    try {
      await onSubmit(values)
    } catch {
      setSubmitError(true)
    }
  })

  const dateErrorKey = fieldErrorKey(errors.date)
  const timeErrorKey = fieldErrorKey(errors.time)
  const doctorNameErrorKey = fieldErrorKey(errors.doctorName)

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="doctorName">{t('appointments.form.doctorNameLabel')}</Label>
          <Input
            id="doctorName"
            placeholder={t('appointments.form.doctorNamePlaceholder')}
            aria-invalid={!!errors.doctorName}
            className="mt-2"
            {...register('doctorName')}
          />
          {doctorNameErrorKey && <p className="text-destructive mt-1 text-sm">{t(doctorNameErrorKey)}</p>}
        </div>
        <div>
          <Label htmlFor="location">{t('appointments.form.locationLabel')}</Label>
          <Input
            id="location"
            placeholder={t('appointments.form.locationPlaceholder')}
            className="mt-2"
            {...register('location')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="date">{t('appointments.form.dateLabel')}</Label>
          <Input id="date" type="date" aria-invalid={!!errors.date} className="mt-2" {...register('date')} />
          {dateErrorKey && <p className="text-destructive mt-1 text-sm">{t(dateErrorKey)}</p>}
        </div>
        <div>
          <Label htmlFor="time">{t('appointments.form.timeLabel')}</Label>
          <Input id="time" type="time" aria-invalid={!!errors.time} className="mt-2" {...register('time')} />
          {timeErrorKey && <p className="text-destructive mt-1 text-sm">{t(timeErrorKey)}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="reason">{t('appointments.form.reasonLabel')}</Label>
        <Input
          id="reason"
          placeholder={t('appointments.form.reasonPlaceholder')}
          className="mt-2"
          {...register('reason')}
        />
      </div>

      {submitError && (
        <p role="alert" className="text-destructive text-sm">
          {t('appointments.form.genericError')}
        </p>
      )}

      <div className="mt-6 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
        {showCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3.5 text-sm font-bold text-ink-muted transition-colors hover:text-ink"
          >
            {t('common.cancel')}
          </button>
        )}
        <Button type="submit" disabled={isSubmitting} className="bg-violet-600 text-white hover:bg-violet-700">
          {isSubmitting ? t('common.saving') : submitLabel}
        </Button>
      </div>
    </form>
  )
}
