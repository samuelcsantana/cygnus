import { useTranslation } from 'react-i18next'
import { useSearchDestinationStore } from '@/shared/stores/searchDestination.store'
export function SearchDestinationBanner() {
  const { t } = useTranslation()
  const target = useSearchDestinationStore((state) => state.target)
  if (!target || target.path === '/dashboard') return null
  return (
    <div
      role="status"
      className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/25 bg-card px-5 py-3"
    >
      <p className="break-words text-sm text-ink">
        {t('search.ui.destination', { query: target.query })}
      </p>
      <button
        type="button"
        className="min-h-11 font-semibold text-primary"
        onClick={() => useSearchDestinationStore.getState().set(null)}
      >
        {t('search.ui.showAll')}
      </button>
    </div>
  )
}
