import { useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePagedList } from '@/hooks/usePagedList'
import { cn } from '@/lib/utils'
import { LoadMoreButton } from '@/shared/components/LoadMoreButton'
import { NoSearchResults } from '@/shared/components/NoSearchResults'
import { SearchInput } from '@/shared/components/SearchInput'
import { AlertCircleIcon } from '@/shared/icons/alert-circle-icon'
import { CheckIcon } from '@/shared/icons/check-icon'
import { ClockIcon } from '@/shared/icons/clock-icon'
import type { IconProps } from '@/shared/icons/icon-base'
import { InfoIcon } from '@/shared/icons/info-icon'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

import type { VaccineItemWithBaby } from '../api/vaccines.hooks'
import { ApplyVaccineDialog } from './ApplyVaccineDialog'
import { VaccineStatusBadge } from './VaccineStatusBadge'

interface VaccineCalendarListProps {
  items: VaccineItemWithBaby[]
  babies: Baby[]
  filterKey?: string
}

// The 700 steps on their own 50 tint (300 on the dark tint), as when these
// squares held text glyphs and owed 4.5:1. Icons owe 3:1, so the old pairs
// clear it with room. GUIDANCE had no dark pair at all and stayed a pale
// square on the dark card; it has one now.
const STATUS_ICON_CLASS: Record<VaccineItemWithBaby['status'], string> = {
  APPLIED: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  DELAYED: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
  PENDING: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  GUIDANCE: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300',
}

// Icons, not the ✓ ○ ! ? characters they replace: a "?" in a box read as an
// image that failed to load, and each character drew differently per system
// font. The status itself is spoken by the badge beside it, so the icon is
// decoration (IconBase sets aria-hidden).
const STATUS_ICON: Record<VaccineItemWithBaby['status'], ComponentType<IconProps>> = {
  APPLIED: CheckIcon,
  DELAYED: AlertCircleIcon,
  PENDING: ClockIcon,
  GUIDANCE: InfoIcon,
}

// Renders a single, merged, household-wide list — each row tagged with which
// baby it belongs to, so a family with several children sees one urgency-sorted
// list instead of one full section repeated per child.
export function VaccineCalendarList({
  items,
  babies,
  filterKey = 'ALL',
}: VaccineCalendarListProps) {
  const { t } = useTranslation()
  const [applyTarget, setApplyTarget] = useState<VaccineItemWithBaby | null>(null)
  // The child filter is the menu's, not this page's: the choice outlives the page
  // it was made on. See selectedBaby.store.ts.
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const babyById = new Map(babies.map((baby) => [baby.id, baby]))

  const babyFiltered = items
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
  const normalizedSearch = normalize(debouncedSearch)
  const filteredItems = normalizedSearch
    ? babyFiltered.filter(
        (item) =>
          normalize(item.name).includes(normalizedSearch) ||
          normalize(item.description).includes(normalizedSearch),
      )
    : babyFiltered

  const { visibleItems, hasMore, loadMore } = usePagedList(
    filteredItems,
    `${normalizedSearch}|${babies.map((baby) => baby.id).join()}|${filterKey}`,
  )

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          id="vaccine-search"
          label={t('vaccines.search.label')}
          value={search}
          onChange={setSearch}
          placeholder={t('vaccines.searchUi.placeholder')}
          clearLabel={t('vaccines.searchUi.clear')}
          inputClassName="h-12 rounded-xl"
          className="w-full sm:max-w-lg"
        />
      </div>

      <p role="status" aria-live="polite" className="mb-4 text-sm text-ink-muted">
        {t('vaccines.searchUi.results', { count: filteredItems.length })}
        {filterKey !== 'ALL' && (
          <>
            {' '}
            ·{' '}
            {t('vaccines.searchUi.filtered', {
              status: t(
                `vaccines.status.${filterKey === 'APPLIED' ? 'appliedShort' : filterKey.toLowerCase()}`,
              ),
            })}
          </>
        )}
      </p>
      {filteredItems.length === 0 ? (
        normalizedSearch ? (
          <NoSearchResults />
        ) : (
          <p role="status" className="rounded-2xl bg-card p-8 text-center text-sm text-ink-muted">
            {t('vaccines.page.noFilter')}
          </p>
        )
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {visibleItems.map((item) => (
              <li key={`${item.babyId}-${item.vaccineId}`}>
                <VaccineRow
                  item={item}
                  baby={babies.length > 1 ? babyById.get(item.babyId) : undefined}
                  onApply={() => setApplyTarget(item)}
                />
              </li>
            ))}
          </ul>
          {hasMore && <LoadMoreButton onClick={loadMore} label={t('common.loadMore')} />}
        </>
      )}

      <ApplyVaccineDialog
        babyId={applyTarget?.babyId ?? ''}
        item={applyTarget}
        onOpenChange={(open) => !open && setApplyTarget(null)}
      />
    </div>
  )
}

interface VaccineRowProps {
  item: VaccineItemWithBaby
  baby: Baby | undefined
  onApply: () => void
}

function VaccineRow({ item, baby, onApply }: VaccineRowProps) {
  const { t } = useTranslation()
  const avatarAppearance = baby ? babyAvatarAppearance(baby.id, baby.avatarColor) : null
  const StatusIcon = STATUS_ICON[item.status]

  const content = (
    <>
      <span
        className={cn(
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]',
          STATUS_ICON_CLASS[item.status],
        )}
      >
        <StatusIcon className="size-[18px]" />
      </span>
      {baby && (
        <span
          title={baby.name}
          className={cn(
            'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black',
            avatarAppearance?.className,
          )}
          style={avatarAppearance?.style}
        >
          {babyInitials(baby.name)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{item.name}</p>
        <p className="text-xs text-ink-muted">
          {baby ? `${baby.name} · ` : ''}
          {t('vaccines.doseLabel', { count: item.doseNumber })} ·{' '}
          {t('vaccines.ageGroupLabel', { count: item.recommendedAgeInMonths })}
        </p>
      </div>
      <VaccineStatusBadge item={item} />
    </>
  )

  const rowClass = cn(
    'flex w-full items-center gap-3 rounded-2xl bg-card p-4 shadow-[0_1px_6px_rgba(0,0,0,0.03)]',
    item.status === 'DELAYED' ? 'border border-rose-100' : 'border border-transparent',
  )

  return (
    <article className={cn(rowClass, 'flex-col items-stretch')}>
      <div className="flex flex-wrap items-center gap-3">{content}</div>
      <div className="flex flex-wrap items-start justify-between gap-3 border-t border-border pt-2">
        <details className="min-w-0 flex-1 text-sm text-ink-muted">
          <summary className="min-h-11 cursor-pointer py-3 font-semibold">
            {t('vaccines.page.details')}
          </summary>
          <p className="pb-3 leading-relaxed">{item.guidance ?? item.description}</p>
        </details>
        {item.status !== 'APPLIED' && item.recommendationKind !== 'RECURRING' && (
          <button
            type="button"
            onClick={onApply}
            className="min-h-11 rounded-xl bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
          >
            {t('vaccines.page.recordDose')}
          </button>
        )}
      </div>
    </article>
  )
}
