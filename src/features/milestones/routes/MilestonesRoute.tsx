import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePagedList } from '@/hooks/usePagedList'
import { cn } from '@/lib/utils'
import { BabyFilterChips } from '@/shared/components/BabyFilterChips'
import { EmptyState } from '@/shared/components/EmptyState'
import { LoadMoreButton } from '@/shared/components/LoadMoreButton'
import { NoSearchResults } from '@/shared/components/NoSearchResults'
import { SearchInput } from '@/shared/components/SearchInput'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'

import { useAllBabiesMilestones } from '../api/milestones.hooks'
import type { MilestoneCategory } from '../api/milestones.schemas'
import { AddMilestoneDialog } from '../components/AddMilestoneDialog'
import { MILESTONE_SUGGESTIONS, type MilestoneSuggestion } from '../components/milestone-suggestions'
import { MILESTONE_CATEGORY_META } from '../components/category-meta'
import { MilestoneTimeline } from '../components/MilestoneTimeline'
import { MilestoneTimelineSkeleton } from '../components/MilestoneTimelineSkeleton'

const CATEGORIES: MilestoneCategory[] = ['MOTOR', 'LANGUAGE', 'SOCIAL', 'COGNITIVE', 'OTHER']

export function MilestonesRoute() {
  const { t } = useTranslation()
  const { isPending, isError, isEmpty, babies, items } = useAllBabiesMilestones()
  const [activeCategory, setActiveCategory] = useState<MilestoneCategory | 'ALL'>('ALL')
  const [babyFilter, setBabyFilter] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [suggestion, setSuggestion] = useState<MilestoneSuggestion | null>(null)

  const openAdd = (from: MilestoneSuggestion | null) => {
    setSuggestion(from)
    setIsAddOpen(true)
  }
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  // Hooks below must run unconditionally on every render (rules-of-hooks) —
  // `items` is simply `[]` while isEmpty is true, so this is safe to compute
  // before the early return.
  const normalizedSearch = debouncedSearch.trim().toLowerCase()
  const filteredItems = [
    ...(activeCategory === 'ALL' ? items : items.filter((item) => item.category === activeCategory)).filter(
      (item) => !babyFilter || item.babyId === babyFilter,
    ),
  ]
    .filter(
      (item) =>
        !normalizedSearch ||
        item.title.toLowerCase().includes(normalizedSearch) ||
        (item.description ?? '').toLowerCase().includes(normalizedSearch),
    )
    .sort((a, b) => b.achievedAt.localeCompare(a.achievedAt))

  const { visibleItems, hasMore, loadMore } = usePagedList(
    filteredItems,
    `${normalizedSearch}|${babyFilter}|${activeCategory}`,
  )

  if (isEmpty) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-ink">{t('milestones.title')}</h2>
          {/* Without the list, items.length is zero because nothing loaded, not
              because nothing was recorded — and "0 momentos especiais
              registrados" reads as a fact about the family. Fourth screen with
              this shape; same treatment as the other three. */}
          {isError ? (
            // Nothing on error: the message below already says the timeline did
            // not load, and a subtitle repeating it only competes with it.
            null
          ) : (
            <p className="mt-1 text-lg text-ink-muted">
              {isPending ? t('milestones.summaryUnavailable') : t('milestones.summary', { count: items.length })}
            </p>
          )}
        </div>
        <Button
          type="button"
          size="cta"
          onClick={() => setIsAddOpen(true)}
          className="rounded-2xl shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
        >
          {t('milestones.action')}
        </Button>
      </div>

      <AddMilestoneDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        suggestion={suggestion ? { title: t(suggestion.titleKey), category: suggestion.category } : undefined}
      />

      {isPending ? (
        <MilestoneTimelineSkeleton />
      ) : isError ? (
        <p className="text-ink-muted py-16 text-center">{t('milestones.genericError')}</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<SparkleIcon className="h-10 w-10" />}
          title={t('milestones.empty.title')}
          description={t('milestones.empty.description')}
          tone="amber"
          action={
            <div className="flex flex-col items-center gap-6">
              <Button
                type="button"
                size="cta"
                onClick={() => openAdd(null)}
                className="rounded-xl shadow-md shadow-emerald-900/20"
              >
                {t('milestones.empty.cta')}
              </Button>

              {/* Exemplos, e não um roteiro. A cópia diz "outras famílias
                  registram", nunca "seu bebê já deveria" — sugerir um calendário
                  de desenvolvimento seria orientação clínica com voz amigável,
                  e é justamente o que este app declara não fazer.

                  Clicáveis porque exemplo que só se lê é exemplo que se ignora:
                  tocar num abre o formulário já preenchido, e tudo continua
                  editável. */}
              <div>
                <p className="text-ink-faint mb-3 text-xs font-semibold tracking-wide uppercase">
                  {t('milestones.empty.suggestionsLabel')}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {MILESTONE_SUGGESTIONS.map((item) => (
                    <button
                      key={item.titleKey}
                      type="button"
                      onClick={() => openAdd(item)}
                      className="border-border bg-card text-ink-muted hover:border-primary/40 hover:text-ink inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors"
                    >
                      <span aria-hidden="true">{MILESTONE_CATEGORY_META[item.category].emoji}</span>
                      {t(item.titleKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <BabyFilterChips babies={babies} value={babyFilter} onChange={setBabyFilter} />
            <SearchInput
              id="milestone-search"
              label={t('milestones.search.label')}
              value={search}
              onChange={setSearch}
              placeholder={t('common.search.placeholder')}
              className="sm:w-64"
            />
          </div>

          {/* role/aria-label/aria-pressed, matching BabyFilterChips right
              above it. Without them this row is a bare list of buttons: its
              first chip is also labelled "Todos", so a screen reader announced
              "Todos, button" twice on this screen with nothing to tell the two
              filters apart, and the selected category was conveyed by fill
              colour alone. */}
          <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label={t('milestones.categoryFilter.groupLabel')}>
            <button
              type="button"
              aria-pressed={activeCategory === 'ALL'}
              onClick={() => setActiveCategory('ALL')}
              className={cn(
                'rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors',
                activeCategory === 'ALL' ? 'bg-primary text-primary-foreground' : 'bg-card text-ink-muted shadow-sm hover:bg-muted',
              )}
            >
              {t('milestones.filterAll')}
            </button>
            {CATEGORIES.map((category) => {
              const meta = MILESTONE_CATEGORY_META[category]
              const isActive = activeCategory === category
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors',
                    isActive ? meta.solidClass : 'bg-card text-ink-muted shadow-sm hover:bg-muted',
                  )}
                >
                  {meta.emoji} {t(`milestones.category.${category.toLowerCase()}`)}
                </button>
              )
            })}
          </div>

          {filteredItems.length === 0 ? (
            <NoSearchResults />
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
