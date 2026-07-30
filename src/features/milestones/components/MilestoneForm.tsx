import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SelectorCardGroup } from '@/shared/components/SelectorCardGroup'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import { createMilestoneFormSchema, milestoneCategorySchema, type MilestoneFormInput } from '../api/milestones.schemas'
import { MILESTONE_CATEGORY_META } from './category-meta'

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

  const categoryOptions = milestoneCategorySchema.options.map((category) => ({
    value: category,
    label: t(`milestones.category.${category.toLowerCase()}`),
    media: <span className="text-xl">{MILESTONE_CATEGORY_META[category].emoji}</span>,
  }))

  const categoryErrorKey = fieldErrorKey(errors.category)
  const titleErrorKey = fieldErrorKey(errors.title)
  const achievedAtErrorKey = fieldErrorKey(errors.achievedAt)
  const photoUrlErrorKey = fieldErrorKey(errors.photoUrl)

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
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
          <Input
            id="achievedAt"
            type="date"
            aria-invalid={!!errors.achievedAt}
            className="mt-2"
            {...register('achievedAt')}
          />
          {achievedAtErrorKey && <p className="text-destructive mt-1 text-sm">{t(achievedAtErrorKey)}</p>}
        </div>
      </div>

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
        <p className="mt-1 text-xs text-slate-400">{t('milestones.form.photoUrlHint')}</p>
      </div>

      {submitError && (
        <p role="alert" className="text-destructive text-sm">
          {t('milestones.form.genericError')}
        </p>
      )}

      <div className="mt-6 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
        {showCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3.5 text-sm font-bold text-slate-600 transition-colors hover:text-slate-900"
          >
            {t('common.cancel')}
          </button>
        )}
        <Button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white hover:bg-slate-800">
          {isSubmitting ? t('common.saving') : submitLabel}
        </Button>
      </div>
    </form>
  )
}
