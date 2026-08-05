import { Controller, type Control } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AllergiesTagInput } from '@/shared/components/AllergiesTagInput'

import type { BabyFormInput } from '../api/babies.schemas'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const
const NOT_INFORMED = 'none'

interface BabyHealthFieldsProps {
  control: Control<BabyFormInput>
}

export function BabyHealthFields({ control }: BabyHealthFieldsProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
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
    </div>
  )
}
