import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { formatDateDisplay } from '@/lib/date'
import { HeartIcon } from '@/shared/icons/heart-icon'

import { isOngoing, type Medication } from '../api/medications.schemas'

const MAX_ITEMS = 4

interface MedicationsOverviewCardProps {
  babies: Baby[]
  items: Medication[]
  isPending: boolean
  isError: boolean
}

/**
 * Os medicamentos da casa no painel — e o **único** caminho até `/medications`, que fica fora da
 * barra de navegação de propósito (a barra tem cinco itens; um sexto remodela a navegação, que é
 * decisão de produto).
 *
 * Mostra primeiro o que não tem fim registrado, porque é o que alguém abre o painel para conferir.
 * O rótulo diz "sem fim registrado" e não "em uso": o app sabe o que foi escrito, não o que a
 * criança está tomando hoje, e a diferença entre as duas frases é a diferença entre um registro e
 * uma afirmação que ninguém verificou.
 */
export function MedicationsOverviewCard({ babies, items, isPending, isError }: MedicationsOverviewCardProps) {
  const { t, i18n } = useTranslation()
  const babyById = new Map(babies.map((baby) => [baby.id, baby]))

  const ongoing = items.filter(isOngoing)
  const latest = [...ongoing, ...items.filter((item) => !isOngoing(item))]
    .sort((a, b) => (isOngoing(a) === isOngoing(b) ? b.startedOn.localeCompare(a.startedOn) : 0))
    .slice(0, MAX_ITEMS)

  return (
    <div className="flex flex-col rounded-2xl bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
            <HeartIcon className="h-[18px] w-[18px]" />
          </span>
          <h3 className="font-display text-base font-extrabold text-ink">{t('medications.title')}</h3>
        </div>
        <Link to="/medications" className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
          {t('babies.dashboard.viewAll')}
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {isPending ? (
          <p className="py-6 text-center text-sm text-ink-muted">{t('common.loading')}</p>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-ink-muted">{t('medications.genericError')}</p>
        ) : latest.length === 0 ? (
          <div className="py-4 text-center">
            <p className="mb-3 text-[13px] text-ink-muted">{t('medications.dashboard.empty')}</p>
            <Link to="/medications" className="text-primary text-[13px] font-bold underline-offset-4 hover:underline">
              {t('medications.dashboard.emptyCta')}
            </Link>
          </div>
        ) : (
          latest.map((medication) => {
            const baby = babyById.get(medication.babyId)
            return (
              <div key={medication.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 truncate text-[13px] font-bold text-ink">{medication.name}</p>
                  <div className="flex items-center gap-2">
                    {baby && <span className="truncate text-[11px] font-semibold text-ink-muted">{baby.name}</span>}
                    {baby && <span className="text-[11px] text-ink-faint">·</span>}
                    <span className="font-mono text-[11px] text-ink-muted">
                      {formatDateDisplay(medication.startedOn, i18n.language)}
                    </span>
                  </div>
                </div>
                {isOngoing(medication) && (
                  <span className="flex-shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    {t('medications.status.open')}
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
