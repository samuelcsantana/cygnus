import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePickerField } from '@/shared/components/DatePickerField'
import { SelectorCardGroup } from '@/shared/components/SelectorCardGroup'
import { CalendarIcon } from '@/shared/icons/calendar-icon'
import { CheckIcon } from '@/shared/icons/check-icon'
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
      {/* Which of the two acts, asked here because this is where time acquires
          meaning — the same fields mean "book it" or "log it" depending only on
          this answer, and the validation flips direction with it.

          Asked rather than inferred. Reading a past date as "they must have
          meant to record it" would silently reinterpret the exact typo the
          scheduling rule exists to catch. */}
      <div>
        <Label htmlFor="appointment-intent">{t('appointments.form.intentLabel')}</Label>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <SelectorCardGroup
              name="appointment-intent"
              value={field.value}
              onValueChange={field.onChange}
              className="mt-2 grid-cols-1 sm:grid-cols-2"
              options={[
                {
                  value: 'SCHEDULED',
                  label: t('appointments.form.intentScheduled'),
                  description: t('appointments.form.intentScheduledHint'),
                  media: (
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300">
                      <CalendarIcon className="h-5 w-5" />
                    </span>
                  ),
                },
                {
                  value: 'COMPLETED',
                  label: t('appointments.form.intentCompleted'),
                  description: t('appointments.form.intentCompletedHint'),
                  media: (
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                      <CheckIcon className="h-5 w-5" />
                    </span>
                  ),
                },
              ]}
            />
          )}
        />
      </div>

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
