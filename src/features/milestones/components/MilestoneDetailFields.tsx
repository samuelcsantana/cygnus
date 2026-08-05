import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import type { MilestoneFormInput } from '../api/milestones.schemas'

interface MilestoneDetailFieldsProps {
  register: UseFormRegister<MilestoneFormInput>
  errors: FieldErrors<MilestoneFormInput>
}

export function MilestoneDetailFields({ register, errors }: MilestoneDetailFieldsProps) {
  const { t } = useTranslation()
  const photoUrlErrorKey = fieldErrorKey(errors.photoUrl)

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
        <Input
          id="photoUrl"
          type="url"
          placeholder={t('milestones.form.photoUrlPlaceholder')}
          aria-invalid={!!errors.photoUrl}
          className="mt-2"
          {...register('photoUrl')}
        />
        {photoUrlErrorKey && <p className="text-destructive mt-1 text-sm">{t(photoUrlErrorKey)}</p>}
        <p className="mt-1 text-xs text-ink-muted">{t('milestones.form.photoUrlHint')}</p>
      </div>
    </div>
  )
}
