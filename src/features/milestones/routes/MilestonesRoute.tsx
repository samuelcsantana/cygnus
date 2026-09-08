import { useSearchDestination } from '@/shared/stores/searchDestination.store'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePagedList } from '@/hooks/usePagedList'
import { LoadMoreButton } from '@/shared/components/LoadMoreButton'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
import { SearchInput } from '@/shared/components/SearchInput'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'
import { useAllBabiesMilestones } from '../api/milestones.hooks'
import type { MilestoneCategory } from '../api/milestones.schemas'
import { AddMilestoneDialog } from '../components/AddMilestoneDialog'
import {
  MILESTONE_SUGGESTIONS,
  type MilestoneSuggestion,
} from '../components/milestone-suggestions'
import { MILESTONE_CATEGORY_META } from '../components/category-meta'
import { MilestoneTimeline } from '../components/MilestoneTimeline'
import { MilestoneTimelineSkeleton } from '../components/MilestoneTimelineSkeleton'

const CATEGORIES: (MilestoneCategory | 'ALL')[] = [
  'ALL',
  'MOTOR',
  'LANGUAGE',
  'SOCIAL',
  'COGNITIVE',
  'OTHER',
]
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()

export function MilestonesRoute() {
  const { t } = useTranslation()
  const all = useAllBabiesMilestones()
  const client = useQueryClient()
  const [activeCategory, setActiveCategory] = useState<MilestoneCategory | 'ALL'>('ALL')
  const babyFilter = useSelectedBabyStore((state) => state.selectedBabyId)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [suggestion, setSuggestion] = useState<MilestoneSuggestion | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const normalizedSearch = normalize(debouncedSearch)
  const babies = all.babies.filter((baby) => !babyFilter || baby.id === babyFilter)
  const entries = all.perBaby.filter((entry) => !babyFilter || entry.baby.id === babyFilter)
  const isPending = all.babies.length ? entries.some((entry) => entry.isPending) : all.isPending
  const isError = all.babies.length ? entries.some((entry) => entry.isError) : all.isError
  // Preserve successfully loaded memories when another child's request fails.
  const destination = useSearchDestination('/milestones')
  const items = entries
    .flatMap((entry) => entry.items)
    .filter((item) => !destination || destination.keys.includes(`milestone:${item.id}`))
  const filteredItems = items
    .filter(
      (item) =>
        (activeCategory === 'ALL' || item.category === activeCategory) &&
        (!normalizedSearch ||
          normalize([item.title, item.description ?? ''].join(' ')).includes(normalizedSearch)),
    )
    .sort((a, b) => b.achievedAt.localeCompare(a.achievedAt))
  const { visibleItems, hasMore, loadMore } = usePagedList(
    filteredItems,
    `${normalizedSearch}|${babyFilter}|${activeCategory}`,
  )
  const openAdd = (from: MilestoneSuggestion | null) => {
    setSuggestion(from)
    setIsAddOpen(true)
  }
  const retry = () => {
    if (!all.babies.length) void client.invalidateQueries({ queryKey: ['babies'] })
    entries
      .filter((entry) => entry.isError)
      .forEach(
        (entry) =>
          void client.invalidateQueries({ queryKey: ['babies', entry.baby.id, 'milestones'] }),
      )
  }
  if (all.isEmpty) return <Navigate to="/dashboard" replace />

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">{t('nav.milestones')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('milestones.page.intro')}</p>
        </div>
        {(items.length > 0 || isPending || isError) && (
          <Button
            size="cta"
            onClick={() => openAdd(null)}
            className="rounded-2xl shadow-lg shadow-emerald-900/20"
          >
            {t('milestones.action')}
          </Button>
        )}
      </div>
      <AddMilestoneDialog
        babies={babies.length ? babies : undefined}
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        suggestion={
          suggestion ? { title: t(suggestion.titleKey), category: suggestion.category } : undefined
        }
      />
      {isError && (
        <div role="alert" className="mb-5 rounded-2xl border border-border bg-card p-5">
          <p>
            {t('milestones.genericError')}{' '}
            {entries
              .filter((entry) => entry.isError)
              .map((entry) => entry.baby.name)
              .join(', ')}
          </p>
          <button type="button" onClick={retry} className="min-h-11 font-semibold text-primary">
            {t('nav.shell.retry')}
          </button>
        </div>
      )}
      {isPending && <MilestoneTimelineSkeleton />}
      {!isPending && !isError && !items.length && (
        <section className="grid gap-6 rounded-3xl border border-amber-600/20 bg-card p-6 sm:p-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12">
          <div>
            <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <SparkleIcon className="h-7 w-7" />
            </span>
            <h2 className="font-display text-2xl font-extrabold text-ink">
              {t('milestones.page.emptyTitle')}
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-muted">
              {t('milestones.page.emptyDescription')}
            </p>
            <Button size="cta" onClick={() => openAdd(null)} className="mt-6 rounded-xl">
              {t('milestones.empty.cta')}
            </Button>
          </div>
          <div className="rounded-2xl bg-amber-50/60 p-5 dark:bg-amber-950/20">
            <h3 className="font-semibold text-ink">{t('milestones.page.ideas')}</h3>
            <p className="mt-1 text-sm text-ink-muted">{t('milestones.page.ideasHint')}</p>
            <div className="mt-4 space-y-2">
              {MILESTONE_SUGGESTIONS.slice(0, 3).map((item) => (
                <button
                  key={item.titleKey}
                  type="button"
                  onClick={() => openAdd(item)}
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-card px-4 py-3 text-left text-sm font-semibold text-ink hover:bg-muted"
                >
                  <span aria-hidden="true">{MILESTONE_CATEGORY_META[item.category].emoji}</span>
                  {t(item.titleKey)}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
      {items.length > 0 && (
        <>
          <div className="mb-6 space-y-4">
            <SearchInput
              id="milestone-search"
              label={t('milestones.page.search')}
              placeholder={t('milestones.page.search')}
              value={search}
              onChange={setSearch}
              clearLabel={t('vaccines.searchUi.clear')}
              inputClassName="h-12 rounded-xl"
              className="w-full sm:max-w-lg"
            />
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label={t('milestones.categoryFilter.groupLabel')}
            >
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                  className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${activeCategory === category ? 'bg-amber-800 text-white dark:bg-amber-700' : 'bg-card text-ink-muted hover:bg-muted'}`}
                >
                  {category === 'ALL'
                    ? t('milestones.filterAll')
                    : t(`milestones.category.${category.toLowerCase()}`)}{' '}
                  ({items.filter((item) => category === 'ALL' || item.category === category).length}
                  )
                </button>
              ))}
            </div>
            <p role="status" className="text-sm text-ink-muted">
              {t('milestones.page.results', { count: filteredItems.length })}
              {(isError || isPending) && ` · ${t('milestones.page.partial')}`}
            </p>
          </div>
          {!filteredItems.length ? (
            <div className="rounded-2xl bg-card p-8 text-center">
              <p className="text-ink-muted">
                {t(normalizedSearch ? 'milestones.page.noSearch' : 'milestones.page.noCategory')}
              </p>
              <Button
                variant="ghost"
                className="mt-3 min-h-11"
                onClick={() => {
                  setSearch('')
                  setActiveCategory('ALL')
                }}
              >
                {t('milestones.page.reset')}
              </Button>
            </div>
          ) : (
            <>
              <MilestoneTimeline items={visibleItems} babies={babies} />
              {hasMore && <LoadMoreButton onClick={loadMore} label={t('common.loadMore')} />}
            </>
          )}
        </>
      )}
    </div>
  )
}
