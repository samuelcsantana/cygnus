import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import type { AppointmentFormInput } from '../api/appointments.schemas'

interface AppointmentMeasurementFieldsProps {
  register: UseFormRegister<AppointmentFormInput>
  errors: FieldErrors<AppointmentFormInput>
}

/**
 * Peso e altura da visita — mostrados só quando a consulta é um fato.
 *
 * A API recusa medida em consulta que ainda não aconteceu, e a razão não é
 * arrumação: estas duas colunas são a série de crescimento, e um ponto preso a
 * uma visita futura seria plotado no futuro sem nada que o distinga de uma
 * medição real. Esconder os campos ao agendar não é decoração da regra — é a
 * única leitura em que o formulário não oferece o que o servidor recusa.
 *
 * `type="text"` com `inputMode="decimal"`, e não `type="number"`: o teclado
 * numérico brasileiro oferece vírgula, e um campo numérico descarta o valor
 * inteiro ao ver uma — a pessoa vê o peso sumir no blur, sem erro nenhum que
 * explique. A vírgula é aceita e convertida em `measurements.ts`.
 */
export function AppointmentMeasurementFields({ register, errors }: AppointmentMeasurementFieldsProps) {
  const { t } = useTranslation()
  const weightErrorKey = fieldErrorKey(errors.weightKg)
  const heightErrorKey = fieldErrorKey(errors.heightCm)

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div>
        <Label htmlFor="weightKg">{t('appointments.form.weightLabel')}</Label>
        <Input
          id="weightKg"
          inputMode="decimal"
          placeholder={t('appointments.form.weightPlaceholder')}
          aria-invalid={!!errors.weightKg}
          aria-describedby={weightErrorKey ? 'weightKg-error' : undefined}
          className="mt-2 font-mono"
          {...register('weightKg')}
        />
        {weightErrorKey && (
          <p id="weightKg-error" className="text-destructive mt-1 text-sm">
            {t(weightErrorKey)}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="heightCm">{t('appointments.form.heightLabel')}</Label>
        <Input
          id="heightCm"
          inputMode="decimal"
          placeholder={t('appointments.form.heightPlaceholder')}
          aria-invalid={!!errors.heightCm}
          aria-describedby={heightErrorKey ? 'heightCm-error' : undefined}
          className="mt-2 font-mono"
          {...register('heightCm')}
        />
        {heightErrorKey && (
          <p id="heightCm-error" className="text-destructive mt-1 text-sm">
            {t(heightErrorKey)}
          </p>
        )}
      </div>
    </div>
  )
}
