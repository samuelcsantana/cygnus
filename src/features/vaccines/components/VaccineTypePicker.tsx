import { useTranslation } from 'react-i18next'
import { CalendarIcon } from '@/shared/icons/calendar-icon'
import { BellIcon } from '@/shared/icons/bell-icon'
import { PencilIcon } from '@/shared/icons/pencil-icon'

export type VaccineTypeChoice = 'CATALOG' | 'CAMPAIGN' | 'CUSTOM'
const types = [
  { value: 'CATALOG', key: 'catalog', Icon: CalendarIcon },
  { value: 'CAMPAIGN', key: 'campaign', Icon: BellIcon },
  { value: 'CUSTOM', key: 'custom', Icon: PencilIcon },
] as const

export function VaccineTypePicker({ onSelect }: { onSelect: (value: VaccineTypeChoice) => void }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      {types.map(({ value, key, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          className="flex w-full items-start gap-4 rounded-2xl border border-border p-5 text-left transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-ink">
              {t(`vaccines.register.type.${key}.title`)}
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-ink-muted">
              {t(`vaccines.register.type.${key}.description`)}
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}
