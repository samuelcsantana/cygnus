import { Controller, useController, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AvatarUploadField } from '@/shared/components/AvatarUploadField'
import { DatePickerField } from '@/shared/components/DatePickerField'
import { SelectorCardGroup } from '@/shared/components/SelectorCardGroup'
import { UserIcon } from '@/shared/icons/user-icon'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import type { BabyFormInput } from '../api/babies.schemas'

interface BabyProfileFieldsProps {
  register: UseFormRegister<BabyFormInput>
  control: Control<BabyFormInput>
  errors: FieldErrors<BabyFormInput>
}

const AVATAR_BORDER_COLORS = ['#2A9D8F', '#E8853A', '#D95560', '#6C63FF']

export function BabyProfileFields({ register, control, errors }: BabyProfileFieldsProps) {
  const { t } = useTranslation()
  const nameErrorKey = fieldErrorKey(errors.name)
  const birthDateErrorKey = fieldErrorKey(errors.birthDate)
  const genderErrorKey = fieldErrorKey(errors.gender)
  const avatarUrlErrorKey = fieldErrorKey(errors.avatarUrl)

  const avatarUrlField = useController({ control, name: 'avatarUrl' })
  const avatarColorField = useController({ control, name: 'avatarColor' })

  const avatarColorOptions = AVATAR_BORDER_COLORS.map((value, index) => ({
    value,
    label: t('babies.form.avatarColorOption', { number: index + 1 }),
  }))

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="avatarUrl">{t('babies.form.avatarLabel')}</Label>
        <AvatarUploadField
          id="avatarUrl"
          className="mt-2"
          value={avatarUrlField.field.value}
          onValueChange={avatarUrlField.field.onChange}
          color={avatarColorField.field.value}
          onColorChange={avatarColorField.field.onChange}
          colorOptions={avatarColorOptions}
          colorGroupLabel={t('babies.form.avatarColorGroupLabel')}
          fallback={<UserIcon className="h-8 w-8 text-ink-faint" />}
          uploadLabel={t('babies.form.avatarUploadAria')}
          removeLabel={t('babies.form.avatarRemoveAria')}
          urlPlaceholder={t('babies.form.avatarUrlPlaceholder')}
          fileTooLargeError={t('babies.form.avatarFileTooLarge')}
          invalidImageError={t('babies.form.avatarInvalidImage')}
        />
        {avatarUrlErrorKey && <p className="text-destructive mt-1 text-sm">{t(avatarUrlErrorKey)}</p>}
      </div>

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
        <Controller
          control={control}
          name="birthDate"
          render={({ field }) => (
            <DatePickerField
              id="birthDate"
              value={field.value}
              onValueChange={field.onChange}
              aria-invalid={!!errors.birthDate}
              aria-describedby={birthDateErrorKey ? 'birthDate-error' : undefined}
              className="mt-2"
            />
          )}
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
    </div>
  )
}
