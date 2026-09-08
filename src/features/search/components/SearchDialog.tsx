import { SearchScopeSelector } from './SearchScopeSelector'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useBabies } from '@/features/babies/api/babies.hooks'
import { SearchInput } from '@/shared/components/SearchInput'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
import { SearchResultsList } from './SearchResultsList'
import { X } from 'lucide-react'

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <SearchPanel onClose={() => onOpenChange(false)} />}
    </Dialog>
  )
}
function SearchPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const babies = useBabies()
  const selected = useSelectedBabyStore((state) => state.selectedBabyId)
  const [scope, setScope] = useState<string | null>(selected)
  const [query, setQuery] = useState('')
  const [viewportHeight, setViewportHeight] = useState<number | undefined>()
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const update = () => setViewportHeight(viewport.height)
    update()
    viewport.addEventListener('resize', update)
    return () => viewport.removeEventListener('resize', update)
  }, [])
  return (
    <DialogContent
      style={viewportHeight ? { maxHeight: Math.max(180, viewportHeight - 24) } : undefined}
      onOpenAutoFocus={(event) => {
        event.preventDefault()
        document.getElementById('app-search')?.focus()
      }}
      showCloseButton={false}
      aria-describedby={undefined}
      onKeyDown={(event) => {
        const target = event.target as HTMLElement
        if (
          (target.tagName !== 'INPUT' && !target.matches('a[data-search-result]')) ||
          event.defaultPrevented ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.nativeEvent.isComposing
        )
          return
        const links = [
          ...event.currentTarget.querySelectorAll<HTMLAnchorElement>('a[data-search-result]'),
        ]
        if (!links.length) return
        const index = links.indexOf(target as HTMLAnchorElement)
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          const next =
            event.key === 'ArrowDown'
              ? (index + 1) % links.length
              : index < 0
                ? links.length - 1
                : (index - 1 + links.length) % links.length
          links[next]?.focus()
        } else if (event.key === 'Enter' && target.tagName === 'INPUT') {
          event.preventDefault()
          links[0]?.click()
        }
      }}
      className="top-3 flex h-[min(42rem,calc(100dvh-1.5rem))] w-[calc(100%-1.5rem)] max-w-none translate-y-0 flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:top-[8%] sm:h-[min(42rem,84dvh)] sm:max-w-2xl"
    >
      <div className="shrink-0 border-b border-border p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <DialogTitle className="font-display text-xl font-extrabold">
            {t('search.title')}
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('search.ui.close')}
            className="flex size-11 items-center justify-center rounded-xl text-ink-muted hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>
        <SearchInput
          id="app-search"
          label={t('search.title')}
          value={query}
          onChange={setQuery}
          placeholder={t('search.placeholder')}
          clearLabel={t('search.ui.clear')}
          inputClassName="h-12 rounded-xl"
        />
        <SearchScopeSelector
          babies={babies.data ?? []}
          value={scope}
          onChange={setScope}
          loading={babies.isPending}
          error={babies.isError}
          onRetry={() => {
            void babies.refetch()
          }}
        />
      </div>
      <SearchResultsList
        query={query}
        scope={scope}
        onExpandScope={() => setScope(null)}
        onNavigate={onClose}
      />
      <p className="hidden shrink-0 border-t border-border px-5 py-3 text-xs text-ink-muted sm:block">
        {t('search.ui.keyboard')}
      </p>
    </DialogContent>
  )
}
