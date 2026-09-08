import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { UsersIcon } from '@/shared/icons/users-icon'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'
import { BabySwitcher } from './BabySwitcher'

export interface FamilyContextProps {
  babies: readonly Baby[]
  selectedBabyId: string | null
  onSelectBaby: (id: string | null) => void
  loading?: boolean
  error?: boolean
  onRetry?: () => void
}

export function FamilyContext({
  babies,
  selectedBabyId,
  onSelectBaby,
  loading,
  error,
  onRetry,
}: FamilyContextProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const baby = babies.find((item) => item.id === selectedBabyId)
  const appearance = babyAvatarAppearance(baby?.id ?? '', baby?.avatarColor)
  const label = loading
    ? t('common.loading')
    : error
      ? t('nav.shell.childrenError')
      : (baby?.name ?? t(babies.length ? 'babies.switcher.all' : 'nav.shell.family'))
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${t('nav.shell.chooseContext')}: ${label}`}
          className="flex min-h-11 w-full min-w-0 items-center gap-2.5 rounded-xl border border-transparent bg-muted/50 px-3 py-1.5 text-left transition-colors hover:bg-muted data-[state=open]:border-primary/25 data-[state=open]:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span
            aria-hidden="true"
            className={`flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full ${baby ? appearance.className : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'}`}
            style={baby ? appearance.style : undefined}
          >
            {baby?.avatarUrl ? (
              <img src={baby.avatarUrl} alt="" className="size-full object-cover" />
            ) : baby ? (
              babyInitials(baby.name)
            ) : (
              <UsersIcon className="size-4" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">{label}</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`size-4 shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        aria-label={t('nav.shell.chooseContext')}
        className="max-h-[min(440px,var(--radix-popover-content-available-height))] w-80 max-w-[calc(100vw-32px)] overflow-y-auto rounded-2xl p-3"
      >
        {loading ? (
          <p role="status">{t('common.loading')}</p>
        ) : error ? (
          <div role="alert" className="space-y-2">
            <p>{t('nav.shell.childrenError')}</p>
            <button type="button" onClick={onRetry} className="min-h-11 font-semibold underline">
              {t('nav.shell.retry')}
            </button>
          </div>
        ) : babies.length ? (
          <BabySwitcher
            babies={babies}
            value={baby?.id ?? null}
            onChange={(id) => {
              onSelectBaby(id)
              setOpen(false)
            }}
          />
        ) : (
          <p className="text-sm text-ink-muted">{t('nav.shell.noChildren')}</p>
        )}
      </PopoverContent>
    </Popover>
  )
}
