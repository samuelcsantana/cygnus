import { useController, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import type { MilestoneFormInput } from '../api/milestones.schemas'
import { MilestonePhotoUploadField } from './MilestonePhotoUploadField'

interface MilestoneDetailFieldsProps {
  register: UseFormRegister<MilestoneFormInput>
  control: Control<MilestoneFormInput>
  errors: FieldErrors<MilestoneFormInput>
}

export function MilestoneDetailFields({ register, control, errors }: MilestoneDetailFieldsProps) {
  const { t } = useTranslation()
  const photoUrlErrorKey = fieldErrorKey(errors.photoUrl)
  const photoUrlField = useController({ control, name: 'photoUrl' })

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="description">{t('milestones.form.descriptionLabel')}</Label>
        <Textarea
          id="description"
          rows={3}
          placeholder={t('milestones.form.descriptionPlaceholder')}
          className="mt-2"
          {...register('description')}
        />
      </div>

      <div>
        <Label htmlFor="photoUrl">{t('milestones.form.photoUrlLabel')}</Label>
        <MilestonePhotoUploadField
          id="photoUrl"
          className="mt-2"
          value={photoUrlField.field.value}
          onValueChange={photoUrlField.field.onChange}
        />
        {photoUrlErrorKey && <p className="text-destructive mt-1 text-sm">{t(photoUrlErrorKey)}</p>}
      </div>
    </div>
  )
}
