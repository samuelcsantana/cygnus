import { useTranslation } from 'react-i18next'

import { SearchIcon } from '@/shared/icons/search-icon'

// Distinct from EmptyState (which covers "no data at all") — this covers
// "there is data, but the current search term matched none of it".
export function NoSearchResults() {
  const { t } = useTranslation()

  return (
    <div className="rounded-[2rem] border border-border bg-card p-12 text-center shadow-sm">
      <div className="bg-muted text-ink-faint mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
        <SearchIcon className="h-7 w-7" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-ink">{t('common.noSearchResults.title')}</h3>
      <p className="text-ink-muted">{t('common.noSearchResults.description')}</p>
    </div>
  )
}
