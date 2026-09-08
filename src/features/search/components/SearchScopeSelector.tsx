import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Users } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { BabySwitcher } from '@/shared/components/BabySwitcher'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'
import { cn } from '@/lib/utils'

interface Props {
  babies: readonly Baby[]
  value: string | null
  onChange: (id: string | null) => void
  loading?: boolean
  error?: boolean
  onRetry: () => void
}
export function SearchScopeSelector({ babies, value, onChange, loading, error, onRetry }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const baby = babies.find((item) => item.id === value)
  const appearance = babyAvatarAppearance(baby?.id ?? '', baby?.avatarColor)
  const label = loading
    ? t('common.loading')
    : error
      ? t('nav.shell.childrenError')
      : (baby?.name ?? t('search.ui.family'))
  return (
    <div className="mt-3 flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-xs font-semibold text-ink-muted">{t('search.ui.scope')}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={t('search.scope.choose', { name: label })}
            aria-describedby={open ? 'search-scope-hint' : undefined}
            onKeyDown={(event) => {
              if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
                event.preventDefault()
                event.stopPropagation()
                setOpen(true)
              }
            }}
            className="flex min-h-11 min-w-0 max-w-full items-center gap-2 rounded-xl border border-transparent bg-muted/50 px-3 py-1.5 text-left hover:bg-muted data-[state=open]:border-primary/25 focus-visible:outline-2 focus-visible:outline-ring sm:max-w-80"
          >
            <span
              aria-hidden="true"
              style={baby ? appearance.style : undefined}
              className={cn(
                'flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold',
                baby
                  ? appearance.className
                  : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
              )}
            >
              {baby?.avatarUrl ? (
                <img src={baby.avatarUrl} alt="" className="size-full object-cover" />
              ) : baby ? (
                babyInitials(baby.name)
              ) : (
                <Users className="size-4" />
              )}
            </span>
            <span className="truncate text-sm font-semibold text-ink">{label}</span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                'size-4 shrink-0 text-ink-muted transition-transform',
                open && 'rotate-180',
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          collisionPadding={24}
          aria-label={t('search.scope.title')}
          onKeyDown={(event) => event.stopPropagation()}
          onEscapeKeyDown={(event) => event.stopPropagation()}
          className="max-h-[min(400px,var(--radix-popover-content-available-height))] w-80 max-w-[calc(100vw-48px)] overflow-y-auto overscroll-contain rounded-2xl p-3"
        >
          <p id="search-scope-hint" className="px-2 pb-2 text-xs leading-relaxed text-ink-muted">
            {t('search.scope.hint')}
          </p>
          {loading ? (
            <p role="status" className="p-2 text-sm text-ink-muted">
              {t('common.loading')}
            </p>
          ) : error ? (
            <div role="alert" className="px-2">
              <p className="text-sm text-ink-muted">{t('nav.shell.childrenError')}</p>
              <button
                type="button"
                onClick={onRetry}
                className="min-h-11 text-sm font-semibold text-primary"
              >
                {t('nav.shell.retry')}
              </button>
            </div>
          ) : (
            <>
              <BabySwitcher
                babies={babies}
                value={baby?.id ?? null}
                prompt={t('search.scope.title')}
                familyLabel={t('search.ui.family')}
                familyDescription={t('search.scope.familyHint')}
                onChange={(id) => {
                  onChange(id)
                  setOpen(false)
                }}
              />
              {!babies.length && (
                <p className="px-2 pt-3 text-xs text-ink-muted">{t('nav.shell.noChildren')}</p>
              )}
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
