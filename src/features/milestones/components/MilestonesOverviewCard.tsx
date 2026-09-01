import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { formatDateDisplay } from '@/lib/date'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'

import type { Milestone } from '../api/milestones.schemas'
import { MILESTONE_CATEGORY_META } from './category-meta'
import { MILESTONE_SUGGESTIONS } from './milestone-suggestions'

const MAX_ITEMS = 4

interface MilestonesOverviewCardProps {
  babies: Baby[]
  items: Milestone[]
  isPending: boolean
  isError: boolean
}

// Household-wide milestones widget for the dashboard: the most recent
// milestones across every child, newest first.
export function MilestonesOverviewCard({ babies, items, isPending, isError }: MilestonesOverviewCardProps) {
  const { t, i18n } = useTranslation()
  const babyById = new Map(babies.map((baby) => [baby.id, baby]))

  const latest = [...items].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt)).slice(0, MAX_ITEMS)

  return (
    <div className="flex flex-col rounded-2xl bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300">
            <SparkleIcon className="h-[18px] w-[18px]" />
          </span>
          <h3 className="font-display text-base font-extrabold text-ink">{t('nav.milestones')}</h3>
        </div>
        <Link to="/milestones" className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
          {t('babies.dashboard.viewAll')}
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {isPending ? (
          <p className="py-6 text-center text-sm text-ink-muted">{t('common.loading')}</p>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-ink-muted">{t('milestones.genericError')}</p>
        ) : latest.length === 0 ? (
          /* Antes: "Nenhum marco registrado ainda", que relata a ausência e não
             convida a nada. Um painel recém-criado tinha seis vazios assim.
             Agora mostra o que outras famílias registram — exemplos, nunca um
             calendário do que a criança "deveria" fazer — e leva para a tela
             onde eles abrem o formulário já preenchido. */
          <div className="py-4">
            <p className="text-ink-muted mb-3 text-center text-[13px]">{t('babies.dashboard.noMilestonesYet')}</p>
            <ul className="mb-4 space-y-2">
              {MILESTONE_SUGGESTIONS.slice(0, 3).map((item) => (
                <li key={item.titleKey} className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="text-base">
                    {MILESTONE_CATEGORY_META[item.category].emoji}
                  </span>
                  <span className="text-ink-muted text-[13px]">{t(item.titleKey)}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/milestones"
              className="text-primary text-[13px] font-bold underline-offset-4 hover:underline"
            >
              {t('babies.dashboard.milestonesEmptyCta')}
            </Link>
          </div>
        ) : (
          latest.map((milestone) => {
            const baby = babyById.get(milestone.babyId)
            const meta = MILESTONE_CATEGORY_META[milestone.category]
            return (
              <div key={milestone.id} className="flex items-start gap-3">
                <span className="flex-shrink-0 text-xl">{meta.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 truncate text-[13px] font-bold text-ink">{milestone.title}</p>
                  <div className="flex items-center gap-2">
                    {baby && <span className="truncate text-[11px] font-semibold text-ink-muted">{baby.name}</span>}
                    <span className="text-[11px] text-ink-faint">·</span>
                    <span className="text-[11px] text-ink-muted">
                      {formatDateDisplay(milestone.achievedAt, i18n.language)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
