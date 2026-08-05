import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePickerField } from '@/shared/components/DatePickerField'
import { SelectorCardGroup } from '@/shared/components/SelectorCardGroup'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import { milestoneCategorySchema, type MilestoneFormInput } from '../api/milestones.schemas'
import { MILESTONE_CATEGORY_META } from './category-meta'

interface MilestoneCoreFieldsProps {
  control: Control<MilestoneFormInput>
  register: UseFormRegister<MilestoneFormInput>
  errors: FieldErrors<MilestoneFormInput>
}

export function MilestoneCoreFields({ control, register, errors }: MilestoneCoreFieldsProps) {
  const { t } = useTranslation()

  const categoryOptions = milestoneCategorySchema.options.map((category) => ({
    value: category,
    label: t(`milestones.category.${category.toLowerCase()}`),
    media: <span className="text-xl">{MILESTONE_CATEGORY_META[category].emoji}</span>,
  }))

  const categoryErrorKey = fieldErrorKey(errors.category)
  const titleErrorKey = fieldErrorKey(errors.title)
  const achievedAtErrorKey = fieldErrorKey(errors.achievedAt)

  return (
    <div className="space-y-6">
      <div>
        <Label id="category-label">{t('milestones.form.categoryLabel')}</Label>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <div className="mt-2" role="group" aria-labelledby="category-label">
              <SelectorCardGroup value={field.value} onValueChange={field.onChange} options={categoryOptions} />
            </div>
          )}
        />
        {categoryErrorKey && <p className="text-destructive mt-1 text-sm">{t(categoryErrorKey)}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Label htmlFor="title">{t('milestones.form.titleLabel')}</Label>
          <Input
            id="title"
            placeholder={t('milestones.form.titlePlaceholder')}
            aria-invalid={!!errors.title}
            className="mt-2"
            {...register('title')}
          />
          {titleErrorKey && <p className="text-destructive mt-1 text-sm">{t(titleErrorKey)}</p>}
        </div>
        <div>
          <Label htmlFor="achievedAt">{t('milestones.form.achievedAtLabel')}</Label>
          <Controller
            control={control}
            name="achievedAt"
            render={({ field }) => (
              <DatePickerField
                id="achievedAt"
                value={field.value}
                onValueChange={field.onChange}
                aria-invalid={!!errors.achievedAt}
                className="mt-2"
              />
            )}
          />
          {achievedAtErrorKey && <p className="text-destructive mt-1 text-sm">{t(achievedAtErrorKey)}</p>}
        </div>
      </div>
    </div>
  )
}
