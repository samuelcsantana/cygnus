import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePickerField } from '@/shared/components/DatePickerField'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import type { MedicationFormInput } from '../api/medications.schemas'

interface MedicationFieldsProps {
  register: UseFormRegister<MedicationFormInput>
  control: Control<MedicationFormInput>
  errors: FieldErrors<MedicationFormInput>
}

/**
 * Os campos de uma receita, escritos como a receita foi escrita.
 *
 * Dose e frequência são texto livre e não têm máscara nem unidade fixa: gotas, ml, mg, meio
 * comprimido, "de 8 em 8 horas", "se a febre voltar". Um campo que recusa o que está na receita é
 * pior do que um que guarda literalmente.
 */
export function MedicationFields({ register, control, errors }: MedicationFieldsProps) {
  const { t } = useTranslation()
  const nameErrorKey = fieldErrorKey(errors.name)
  const startedOnErrorKey = fieldErrorKey(errors.startedOn)
  const endedOnErrorKey = fieldErrorKey(errors.endedOn)

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="medication-name">{t('medications.form.nameLabel')}</Label>
        <Input
          id="medication-name"
          placeholder={t('medications.form.namePlaceholder')}
          aria-invalid={!!errors.name}
          aria-describedby={nameErrorKey ? 'medication-name-error' : undefined}
          className="mt-2"
          {...register('name')}
        />
        {nameErrorKey && (
          <p id="medication-name-error" className="text-destructive mt-1 text-sm">
            {t(nameErrorKey)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="medication-dosage">{t('medications.form.dosageLabel')}</Label>
          <Input
            id="medication-dosage"
            placeholder={t('medications.form.dosagePlaceholder')}
            className="mt-2 font-mono"
            {...register('dosage')}
          />
        </div>
        <div>
          <Label htmlFor="medication-frequency">{t('medications.form.frequencyLabel')}</Label>
          <Input
            id="medication-frequency"
            placeholder={t('medications.form.frequencyPlaceholder')}
            className="mt-2 font-mono"
            {...register('frequency')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="medication-startedOn">{t('medications.form.startedOnLabel')}</Label>
          <Controller
            control={control}
            name="startedOn"
            render={({ field }) => (
              <DatePickerField
                id="medication-startedOn"
                value={field.value ?? ''}
                onValueChange={field.onChange}
                aria-invalid={!!errors.startedOn}
                aria-describedby={startedOnErrorKey ? 'medication-startedOn-error' : undefined}
                className="mt-2"
              />
            )}
          />
          {startedOnErrorKey && (
            <p id="medication-startedOn-error" className="text-destructive mt-1 text-sm">
              {t(startedOnErrorKey)}
            </p>
          )}
        </div>
        <div>
          {/* Vazio é a resposta certa para o que ainda está sendo tomado — e o rótulo diz
              "opcional" em vez de "em uso", porque deixar em branco significa "sem fim
              registrado", não "a criança está tomando hoje". */}
          <Label htmlFor="medication-endedOn">{t('medications.form.endedOnLabel')}</Label>
          <Controller
            control={control}
            name="endedOn"
            render={({ field }) => (
              <DatePickerField
                id="medication-endedOn"
                value={field.value ?? ''}
                onValueChange={field.onChange}
                aria-invalid={!!errors.endedOn}
                aria-describedby={endedOnErrorKey ? 'medication-endedOn-error' : undefined}
                className="mt-2"
              />
            )}
          />
          {endedOnErrorKey && (
            <p id="medication-endedOn-error" className="text-destructive mt-1 text-sm">
              {t(endedOnErrorKey)}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="medication-reason">{t('medications.form.reasonLabel')}</Label>
          <Input
            id="medication-reason"
            placeholder={t('medications.form.reasonPlaceholder')}
            className="mt-2"
            {...register('reason')}
          />
        </div>
        <div>
          <Label htmlFor="medication-prescriber">{t('medications.form.prescriberLabel')}</Label>
          <Input
            id="medication-prescriber"
            placeholder={t('medications.form.prescriberPlaceholder')}
            className="mt-2"
            {...register('prescriberName')}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="medication-notes">{t('medications.form.notesLabel')}</Label>
        <Textarea id="medication-notes" rows={3} className="mt-2" {...register('notes')} />
      </div>
    </div>
  )
}
