import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSpecialistsForBaby } from '@/features/specialists/api/specialists.hooks'
import { AutocompleteInput } from '@/shared/components/AutocompleteInput'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import { useMedicalSpecialties } from '../api/appointments.hooks'
import type { AppointmentFormInput } from '../api/appointments.schemas'

interface AppointmentProfessionalFieldsProps {
  register: UseFormRegister<AppointmentFormInput>
  control: Control<AppointmentFormInput>
  setValue: UseFormSetValue<AppointmentFormInput>
  errors: FieldErrors<AppointmentFormInput>
  /**
   * A criança de quem é a consulta, quando já se sabe.
   *
   * Sem ela o campo continua sendo texto livre e nada muda — é o caso do reagendamento, que não
   * escolhe criança. Com ela, o nome passa a sugerir quem já está salvo **daquela** criança, que é
   * o único recorte que existe: a lista é por criança, não por conta.
   */
  babyId?: string | null
}

export function AppointmentProfessionalFields({
  register,
  control,
  setValue,
  errors,
  babyId,
}: AppointmentProfessionalFieldsProps) {
  const { t } = useTranslation()
  const { data: specialtySuggestions = [] } = useMedicalSpecialties()
  const { data: specialists = [] } = useSpecialistsForBaby(babyId ?? null)
  const doctorNameErrorKey = fieldErrorKey(errors.doctorName)

  const doctorName = useWatch({ control, name: 'doctorName' }) ?? ''
  const matchedSpecialist = specialists.find(
    (specialist) => specialist.name.toLowerCase() === doctorName.trim().toLowerCase(),
  )
  // O gatilho só aparece quando há um nome digitado que ainda não está salvo. Oferecer "salvar"
  // para quem acabou de escolher alguém da lista seria oferecer duplicata.
  const canOfferToSave = !!babyId && doctorName.trim().length > 0 && !matchedSpecialist

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="doctorName">{t('appointments.form.doctorNameLabel')}</Label>
          {/* Sempre o mesmo componente, com a lista vazia quando ainda não há criança escolhida.
              Trocar entre `<Input>` e este conforme a criança carrega **remonta o campo no meio da
              digitação** — a consulta de crianças resolve depois do primeiro render — e o que a
              pessoa já tinha escrito some sem aviso. Custou um teste vermelho para aparecer. */}
          <Controller
            control={control}
            name="doctorName"
            render={({ field }) => (
              <AutocompleteInput
                id="doctorName"
                placeholder={t('appointments.form.doctorNamePlaceholder')}
                aria-invalid={!!errors.doctorName}
                aria-describedby={doctorNameErrorKey ? 'doctorName-error' : undefined}
                className="mt-2"
                value={field.value ?? ''}
                onValueChange={(value) => {
                  field.onChange(value)
                  // Escolher alguém da lista preenche a especialidade e guarda o vínculo; digitar um
                  // nome novo o desfaz. `doctorName` continua sendo o que vai gravado na consulta nos
                  // dois casos — o vínculo é adicional, nunca substituto.
                  const picked = specialists.find((specialist) => specialist.name === value)
                  setValue('specialistId', picked?.id)
                  if (picked?.specialty) {
                    setValue('specialty', picked.specialty)
                  }
                }}
                onBlur={field.onBlur}
                suggestions={specialists.map((specialist) => specialist.name)}
              />
            )}
          />
          {doctorNameErrorKey && (
            <p id="doctorName-error" className="text-destructive mt-1 text-sm">
              {t(doctorNameErrorKey)}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="specialty">{t('appointments.form.specialtyLabel')}</Label>
          <Controller
            control={control}
            name="specialty"
            render={({ field }) => (
              <AutocompleteInput
                id="specialty"
                placeholder={t('appointments.form.specialtyPlaceholder')}
                className="mt-2"
                value={field.value ?? ''}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                suggestions={specialtySuggestions}
              />
            )}
          />
        </div>
      </div>

      {/* Inline e ignorável, que é a razão de o cadastro funcionar: ninguém abre o app para
          cadastrar o pediatra, abre para marcar consulta. Marcado, o profissional é salvo **junto
          com a consulta** e não antes — se o diálogo for abandonado, nada foi criado. */}
      {canOfferToSave && (
        <Controller
          control={control}
          name="saveSpecialist"
          render={({ field }) => (
            <label className="flex items-start gap-2.5 text-sm text-ink-muted">
              <input
                type="checkbox"
                className="accent-primary mt-0.5 h-4 w-4 flex-shrink-0"
                checked={field.value ?? false}
                onChange={(event) => field.onChange(event.target.checked)}
              />
              <span>{t('appointments.form.saveSpecialist', { name: doctorName.trim() })}</span>
            </label>
          )}
        />
      )}

      <div>
        <Label htmlFor="location">{t('appointments.form.locationLabel')}</Label>
        <Input
          id="location"
          placeholder={t('appointments.form.locationPlaceholder')}
          className="mt-2"
          {...register('location')}
        />
      </div>
    </div>
  )
}
