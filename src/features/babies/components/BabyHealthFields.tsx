import { Controller, type Control, type UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AllergiesTagInput } from '@/shared/components/AllergiesTagInput'

import type { BabyFormInput } from '../api/babies.schemas'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const
const NOT_INFORMED = 'none'

interface BabyHealthFieldsProps {
  register: UseFormRegister<BabyFormInput>
  control: Control<BabyFormInput>
}

export function BabyHealthFields({ register, control }: BabyHealthFieldsProps) {
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

      {/* Plan and member number are two fields and not one string because they are read at
          different moments: the name identifies which network to look for, the number is what the
          desk types in. Neither has a client-side format — operators print letters, dashes and
          leading zeros — so validating either would only reject real cards. */}
      <div>
        <Label htmlFor="healthPlanName">{t('babies.form.healthPlanNameLabel')}</Label>
        <Input
          id="healthPlanName"
          placeholder={t('babies.form.healthPlanNamePlaceholder')}
          className="mt-2"
          {...register('healthPlanName')}
        />
      </div>

      <div>
        <Label htmlFor="healthPlanNumber">{t('babies.form.healthPlanNumberLabel')}</Label>
        <Input
          id="healthPlanNumber"
          placeholder={t('babies.form.healthPlanNumberPlaceholder')}
          className="mt-2 font-mono"
          {...register('healthPlanNumber')}
        />
      </div>
    </div>
  )
}
