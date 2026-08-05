import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AutocompleteInput } from '@/shared/components/AutocompleteInput'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import { useMedicalSpecialties } from '../api/appointments.hooks'
import type { AppointmentFormInput } from '../api/appointments.schemas'

interface AppointmentProfessionalFieldsProps {
  register: UseFormRegister<AppointmentFormInput>
  control: Control<AppointmentFormInput>
  errors: FieldErrors<AppointmentFormInput>
}

export function AppointmentProfessionalFields({ register, control, errors }: AppointmentProfessionalFieldsProps) {
  const { t } = useTranslation()
  const { data: specialtySuggestions = [] } = useMedicalSpecialties()
  const doctorNameErrorKey = fieldErrorKey(errors.doctorName)

  return (
    <div className="space-y-6">
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
          <Label htmlFor="specialty">{t('appointments.form.specialtyLabel')}</Label>
          <Controller
            control={control}
            name="specialty"
            render={({ field }) => (
              <AutocompleteInput
                id="specialty"
                placeholder={t('appointments.form.specialtyPlaceholder')}
                className="mt-2"
                value={field.value ?? ''}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                suggestions={specialtySuggestions}
              />
            )}
          />
        </div>
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
  )
}
