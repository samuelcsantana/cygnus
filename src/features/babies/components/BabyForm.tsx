import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AllergiesTagInput } from '@/shared/components/AllergiesTagInput'
import { SelectorCardGroup } from '@/shared/components/SelectorCardGroup'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import { babyFormSchema, type BabyFormInput } from '../api/babies.schemas'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const
const NOT_INFORMED = 'none'

interface BabyFormProps {
  defaultValues?: Partial<BabyFormInput>
  onSubmit: (values: BabyFormInput) => Promise<void>
  submitLabel: string
  onCancel?: () => void
  showCancel?: boolean
}

export function BabyForm({ defaultValues, onSubmit, submitLabel, onCancel, showCancel }: BabyFormProps) {
  const { t } = useTranslation()
  const [submitError, setSubmitError] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BabyFormInput>({
    resolver: zodResolver(babyFormSchema),
    defaultValues: { allergies: [], avatarUrl: '', ...defaultValues },
  })

  const handleFormSubmit = handleSubmit(async (values) => {
    setSubmitError(false)
    try {
      await onSubmit(values)
    } catch {
      setSubmitError(true)
    }
  })

  const nameErrorKey = fieldErrorKey(errors.name)
  const birthDateErrorKey = fieldErrorKey(errors.birthDate)
  const genderErrorKey = fieldErrorKey(errors.gender)
  const avatarUrlErrorKey = fieldErrorKey(errors.avatarUrl)

  return (
    <form onSubmit={handleFormSubmit} className="relative z-10 space-y-6" noValidate>
      <div>
        <Label htmlFor="name">{t('babies.form.nameLabel')}</Label>
        <Input
          id="name"
          placeholder={t('babies.form.namePlaceholder')}
          aria-invalid={!!errors.name}
          aria-describedby={nameErrorKey ? 'name-error' : undefined}
          className="mt-2"
          {...register('name')}
        />
        {nameErrorKey && (
          <p id="name-error" className="text-destructive mt-1 text-sm">
            {t(nameErrorKey)}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="birthDate">{t('babies.form.birthDateLabel')}</Label>
        <Input
          id="birthDate"
          type="date"
          aria-invalid={!!errors.birthDate}
          aria-describedby={birthDateErrorKey ? 'birthDate-error' : undefined}
          className="mt-2"
          {...register('birthDate')}
        />
        {birthDateErrorKey && (
          <p id="birthDate-error" className="text-destructive mt-1 text-sm">
            {t(birthDateErrorKey)}
          </p>
        )}
      </div>

      <div>
        <Label id="gender-label">{t('babies.form.genderLabel')}</Label>
        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <div className="mt-2" role="group" aria-labelledby="gender-label">
              <SelectorCardGroup
                value={field.value}
                onValueChange={field.onChange}
                options={[
                  { value: 'MALE', label: t('babies.form.genderMale') },
                  { value: 'FEMALE', label: t('babies.form.genderFemale') },
                ]}
              />
            </div>
          )}
        />
        {genderErrorKey && <p className="text-destructive mt-1 text-sm">{t(genderErrorKey)}</p>}
      </div>

      <div>
        <Label htmlFor="bloodType">{t('babies.form.bloodTypeLabel')}</Label>
        <Controller
          control={control}
          name="bloodType"
          render={({ field }) => (
            <Select
              value={field.value ?? NOT_INFORMED}
              onValueChange={(value) => field.onChange(value === NOT_INFORMED ? undefined : value)}
            >
              <SelectTrigger id="bloodType" className="mt-2 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NOT_INFORMED}>{t('babies.form.bloodTypeNotInformed')}</SelectItem>
                {BLOOD_TYPES.map((bloodType) => (
                  <SelectItem key={bloodType} value={bloodType}>
                    {bloodType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div>
        <Label htmlFor="allergies">{t('babies.form.allergiesLabel')}</Label>
        <Controller
          control={control}
          name="allergies"
          render={({ field }) => (
            <AllergiesTagInput
              id="allergies"
              value={field.value ?? []}
              onChange={field.onChange}
              placeholder={t('babies.form.allergiesPlaceholder')}
              removeLabel={(item) => t('babies.form.allergiesRemoveAria', { value: item })}
            />
          )}
        />
      </div>

      <div>
        <Label htmlFor="avatarUrl">{t('babies.form.avatarUrlLabel')}</Label>
        <Input
          id="avatarUrl"
          type="url"
          placeholder={t('babies.form.avatarUrlPlaceholder')}
          aria-invalid={!!errors.avatarUrl}
          aria-describedby={avatarUrlErrorKey ? 'avatarUrl-error' : undefined}
          className="mt-2"
          {...register('avatarUrl')}
        />
        {avatarUrlErrorKey && (
          <p id="avatarUrl-error" className="text-destructive mt-1 text-sm">
            {t(avatarUrlErrorKey)}
          </p>
        )}
      </div>

      {submitError && (
        <p role="alert" className="text-destructive text-sm">
          {t('babies.form.genericError')}
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.saving') : submitLabel}
        </Button>
      </div>
    </form>
  )
}
