import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePickerField } from '@/shared/components/DatePickerField'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import type { AppointmentFormInput } from '../api/appointments.schemas'

interface AppointmentScheduleFieldsProps {
  register: UseFormRegister<AppointmentFormInput>
  control: Control<AppointmentFormInput>
  errors: FieldErrors<AppointmentFormInput>
}

export function AppointmentScheduleFields({ register, control, errors }: AppointmentScheduleFieldsProps) {
  const { t } = useTranslation()
  const dateErrorKey = fieldErrorKey(errors.date)
  const timeErrorKey = fieldErrorKey(errors.time)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="date">{t('appointments.form.dateLabel')}</Label>
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <DatePickerField
                id="date"
                value={field.value}
                onValueChange={field.onChange}
                aria-invalid={!!errors.date}
                aria-describedby={dateErrorKey ? 'date-error' : undefined}
                className="mt-2"
              />
            )}
          />
          {dateErrorKey && (
            <p id="date-error" className="text-destructive mt-1 text-sm">
              {t(dateErrorKey)}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="time">{t('appointments.form.timeLabel')}</Label>
          <Input
            id="time"
            type="time"
            aria-invalid={!!errors.time}
            aria-describedby={timeErrorKey ? 'time-error' : undefined}
            className="mt-2"
            {...register('time')}
          />
          {timeErrorKey && (
            <p id="time-error" className="text-destructive mt-1 text-sm">
              {t(timeErrorKey)}
            </p>
          )}
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
    </div>
  )
}
