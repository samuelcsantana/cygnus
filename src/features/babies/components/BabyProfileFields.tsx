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

/**
 * Os hexes ficam literais aqui **de propósito**: o valor escolhido é gravado
 * em `avatarColor` e volta do banco como string, então não pode ser um
 * `var(--color-…)` resolvido em tempo de render.
 *
 * O que não podia ficar implícito é a origem. Três destes são cópia exata de
 * tokens do `@theme` (`src/index.css`), e sem esta anotação um token mudar
 * deixaria a paleta divergindo em silêncio — o `CLAUDE.md` §4 diz que o
 * `@theme` é a fonte única de cor.
 *
 *   #E8853A  = --color-amber-500
 *   #D95560  = --color-rose-500
 *   #6C63FF  = --color-violet-500
 *   #2A9D8F  = nada. É o teal da rampa apagada em 25/08/2026 (ver o comentário
 *              no topo do @theme). Os três irmãos são tokens vivos; este é
 *              fóssil, e continua sendo oferecido como opção. Trocá-lo é
 *              escolha de marca, não de implementação — registrado na fila.
 *
 * Trocar a paleta **não** altera avatares já salvos: muda o que é oferecido,
 * não o que está gravado.
 */
const AVATAR_BORDER_COLORS = ['#2A9D8F', '#E8853A', '#D95560', '#6C63FF']

/** O cartão de "não informar" precisa de um valor para o grupo de rádio; ele nunca é enviado. */
const NOT_INFORMED = 'none'

export function BabyProfileFields({ register, control, errors }: BabyProfileFieldsProps) {
  const { t } = useTranslation()
  const nameErrorKey = fieldErrorKey(errors.name)
  const birthDateErrorKey = fieldErrorKey(errors.birthDate)
  const sexAtBirthErrorKey = fieldErrorKey(errors.sexAtBirth)
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
          removeLabel={t('babies.form.avatarRemove')}
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

      {/* Sexo ao nascer, e não "Sexo" nem "gênero": é a variável clínica que a Caderneta da Criança
          imprime. O terceiro cartão grava **ausência de valor**, não um terceiro valor de enum —
          "prefiro não informar" é resposta legítima porque este campo não é lido por nada, e pedir
          dado sensível de uma criança sem uso não se justifica. */}
      <div>
        <Label id="sex-at-birth-label">{t('babies.form.sexAtBirthLabel')}</Label>
        <Controller
          control={control}
          name="sexAtBirth"
          render={({ field }) => (
            <div className="mt-2" role="group" aria-labelledby="sex-at-birth-label">
              {/* Empilhado, e não lado a lado. Medido dentro deste diálogo: com três cartões na
                  coluna da esquerda cada um fica com 104px, e "Masculino" precisa de 71px de texto
                  num espaço de 48 — transborda por cima do cartão vizinho. Dois cabiam; três não.
                  Vertical também é o que dá espaço ao rótulo mais longo sem quebrá-lo em três
                  linhas no celular. */}
              <SelectorCardGroup
                layout="vertical"
                value={field.value ?? NOT_INFORMED}
                onValueChange={(value) => field.onChange(value === NOT_INFORMED ? undefined : value)}
                options={[
                  { value: 'MALE', label: t('babies.form.sexAtBirthMale') },
                  { value: 'FEMALE', label: t('babies.form.sexAtBirthFemale') },
                  { value: NOT_INFORMED, label: t('babies.form.sexAtBirthNotInformed') },
                ]}
              />
            </div>
          )}
        />
        {sexAtBirthErrorKey && <p className="text-destructive mt-1 text-sm">{t(sexAtBirthErrorKey)}</p>}
      </div>
    </div>
  )
}
