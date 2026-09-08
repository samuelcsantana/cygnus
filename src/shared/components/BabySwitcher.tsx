import { useEffect, useRef } from 'react'
import { Check, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { useAgeLabel } from '@/hooks/useAgeLabel'
import { cn } from '@/lib/utils'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

interface BabySwitcherProps {
  babies: readonly Baby[]
  value: string | null
  onChange: (babyId: string | null) => void
  className?: string
  prompt?: string
  familyLabel?: string
  familyDescription?: string
}

export function BabySwitcher({
  babies,
  value,
  onChange,
  className,
  prompt,
  familyLabel,
  familyDescription,
}: BabySwitcherProps) {
  const { t } = useTranslation()
  const ageLabel = useAgeLabel()
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    menuRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus()
  }, [])
  const options = [
    {
      id: null,
      name: familyLabel ?? t('babies.switcher.all'),
      description: familyDescription ?? t('babies.switcher.familyDescription'),
      baby: undefined,
    },
    ...babies.map((baby) => ({
      id: baby.id,
      name: baby.name,
      description: ageLabel(baby.birthDate),
      baby,
    })),
  ]
  return (
    <div className={cn('space-y-3', className)}>
      <p className="px-2 pt-1 text-sm font-semibold text-ink">
        {prompt ?? t('babies.switcher.prompt')}
      </p>
      <div
        ref={menuRef}
        role="menu"
        aria-label={prompt ?? t('babies.switcher.prompt')}
        className="space-y-1"
        onKeyDown={(event) => {
          if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
          event.preventDefault()
          const rows = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'),
          )
          const current = rows.indexOf(event.target as HTMLButtonElement)
          const next =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? rows.length - 1
                : (current + (event.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length
          rows[next]?.focus()
        }}
      >
        {options.map(({ id, name, description, baby }) => {
          const active = value === id
          const appearance = babyAvatarAppearance(baby?.id ?? '', baby?.avatarColor)
          return (
            <button
              key={id ?? 'family'}
              type="button"
              role="menuitemradio"
              aria-label={name}
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(id)}
              className={cn(
                'flex min-h-16 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                active ? 'border-primary/25 bg-primary/5' : 'border-transparent hover:bg-muted',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold',
                  baby ? appearance.className : 'bg-muted text-ink-muted',
                )}
                style={baby ? appearance.style : undefined}
              >
                {baby?.avatarUrl ? (
                  <img src={baby.avatarUrl} alt="" className="size-full object-cover" />
                ) : baby ? (
                  babyInitials(baby.name)
                ) : (
                  <Users className="size-5" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words text-sm font-semibold text-ink">{name}</span>
                <span className="block text-xs text-ink-muted">{description}</span>
              </span>
              <span className="w-4 shrink-0">
                {active && <Check aria-hidden="true" className="size-4 text-primary" />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
