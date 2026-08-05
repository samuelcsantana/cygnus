import { Controller, type Control, type FieldErrors, type Path, type UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePickerField } from '@/shared/components/DatePickerField'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import type { VaccineApplicationDetailsInput } from '../api/vaccines.schemas'

interface VaccineApplicationDetailsFieldsProps<T extends VaccineApplicationDetailsInput> {
  register: UseFormRegister<T>
  control: Control<T>
  errors: FieldErrors<T>
}

// Generic over T so the same field set can be reused by ApplyVaccineDialog's
// ApplyVaccineInput and the register wizard's step 2 (both extend
// VaccineApplicationDetailsInput with the exact same field names/types) —
// the `as Path<T>` casts below are safe because of that bound, not a shortcut.
export function VaccineApplicationDetailsFields<T extends VaccineApplicationDetailsInput>({
  register,
  control,
  errors,
}: VaccineApplicationDetailsFieldsProps<T>) {
  const { t } = useTranslation()
  const dateErrorKey = fieldErrorKey(errors.applicationDate as never)
  const photoUrlErrorKey = fieldErrorKey(errors.photoUrl as never)

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="applicationDate">{t('vaccines.applicationDetails.dateLabel')}</Label>
        <Controller
          control={control}
          name={'applicationDate' as Path<T>}
          render={({ field }) => (
            <DatePickerField
              id="applicationDate"
              value={field.value as string}
              onValueChange={field.onChange}
              className="mt-2"
              aria-invalid={!!errors.applicationDate}
            />
          )}
        />
        {dateErrorKey && <p className="text-destructive mt-1 text-sm">{t(dateErrorKey)}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="batchNumber">{t('vaccines.applicationDetails.batchNumberLabel')}</Label>
          <Input
            id="batchNumber"
            className="mt-2"
            placeholder={t('vaccines.applicationDetails.batchNumberPlaceholder')}
            {...register('batchNumber' as Path<T>)}
          />
        </div>
        <div>
          <Label htmlFor="location">{t('vaccines.applicationDetails.locationLabel')}</Label>
          <Input
            id="location"
            className="mt-2"
            placeholder={t('vaccines.applicationDetails.locationPlaceholder')}
            {...register('location' as Path<T>)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="professional">{t('vaccines.applicationDetails.professionalLabel')}</Label>
        <Input
          id="professional"
          className="mt-2"
          placeholder={t('vaccines.applicationDetails.professionalPlaceholder')}
          {...register('professional' as Path<T>)}
        />
      </div>

      <div>
        <Label htmlFor="photoUrl">{t('vaccines.applicationDetails.photoUrlLabel')}</Label>
        <Input
          id="photoUrl"
          type="url"
          placeholder={t('vaccines.applicationDetails.photoUrlPlaceholder')}
          className="mt-2"
          aria-invalid={!!errors.photoUrl}
          {...register('photoUrl' as Path<T>)}
        />
        {photoUrlErrorKey && <p className="text-destructive mt-1 text-sm">{t(photoUrlErrorKey)}</p>}
      </div>

      <div>
        <Label htmlFor="notes">{t('vaccines.applicationDetails.notesLabel')}</Label>
        <Textarea id="notes" rows={3} className="mt-2" {...register('notes' as Path<T>)} />
      </div>
    </div>
  )
}
