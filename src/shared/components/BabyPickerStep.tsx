import { useTranslation } from 'react-i18next'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { ageInMonths } from '@/lib/date'
import { cn } from '@/lib/utils'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

import { SelectorCardGroup } from './SelectorCardGroup'

interface BabyPickerStepProps {
  babies: Baby[]
  value: string | null
  onSelect: (babyId: string) => void
}

// First step shared by the vaccine/appointment/milestone "Add" wizards when the
// household has more than one baby — skipped entirely (see soleBaby()) otherwise.
export function BabyPickerStep({ babies, value, onSelect }: BabyPickerStepProps) {
  const { t } = useTranslation()

  return (
    <div className="animate-fade-in-up space-y-4">
      <p className="text-sm text-ink-muted">{t('babies.picker.subtitle')}</p>
      <SelectorCardGroup
        layout="vertical"
        value={value ?? ''}
        onValueChange={onSelect}
        options={babies.map((baby) => {
          const avatarAppearance = babyAvatarAppearance(baby.id, baby.avatarColor)
          return {
            value: baby.id,
            label: baby.name,
            description: t('babies.monthsOld', { count: ageInMonths(baby.birthDate) }),
            media: (
              <span
                className={cn(
                  'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-black',
                  avatarAppearance.className,
                )}
                style={avatarAppearance.style}
              >
                {babyInitials(baby.name)}
              </span>
            ),
          }
        })}
      />
    </div>
  )
}
