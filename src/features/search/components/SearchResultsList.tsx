import { useQueryClient } from '@tanstack/react-query'
import { useSearchDestinationStore } from '@/shared/stores/searchDestination.store'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useAllBabiesAppointments } from '@/features/appointments/api/appointments.hooks'
import { useBabies } from '@/features/babies/api/babies.hooks'
import { useAllBabiesMedications } from '@/features/medications/api/medications.hooks'
import { useAllBabiesMilestones } from '@/features/milestones/api/milestones.hooks'
import { useSpecialists } from '@/features/specialists/api/specialists.hooks'
import {
  useAllBabiesAdhocVaccines,
  useAllBabiesVaccineCalendars,
} from '@/features/vaccines/api/vaccines.hooks'
import { DashboardIcon } from '@/shared/icons/dashboard-icon'
import { HeartIcon } from '@/shared/icons/heart-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'
import { UsersIcon } from '@/shared/icons/users-icon'

import {
  groupByDomain,
  MIN_QUERY_LENGTH,
  normalise,
  search,
  type SearchDomain,
  type SearchResult,
} from '../search'

const PER_DOMAIN_LIMIT = 5

const DOMAIN_TONE: Record<SearchDomain, string> = {
  babies: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  vaccines: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  appointments: 'bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
  specialists: 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300',
  medications: 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
  milestones: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
}
const DOMAIN_ICON: Record<SearchDomain, typeof SyringeIcon> = {
  babies: DashboardIcon,
  vaccines: SyringeIcon,
  appointments: StethoscopeIcon,
  specialists: UsersIcon,
  medications: HeartIcon,
  milestones: SparkleIcon,
}

/** The menu label of the section a result lives in — the same word the reader will land on. */
const DOMAIN_LABEL: Record<SearchDomain, string> = {
  babies: 'nav.dashboard',
  vaccines: 'nav.vaccines',
  appointments: 'nav.appointments',
  specialists: 'nav.specialists',
  medications: 'nav.medications',
  milestones: 'nav.milestones',
}

export function SearchResultsList({
  query,
  scope = null,
  onExpandScope,
  onNavigate,
}: {
  query: string
  scope?: string | null
  onExpandScope?: () => void
  onNavigate: () => void
}) {
  const { t, i18n } = useTranslation()
  const client = useQueryClient()
  const babies = useBabies()
  const vaccines = useAllBabiesVaccineCalendars()
  const adhoc = useAllBabiesAdhocVaccines(scope ? [scope] : undefined)
  const appointments = useAllBabiesAppointments()
  const medications = useAllBabiesMedications()
  const milestones = useAllBabiesMilestones()
  const specialists = useSpecialists()
  const entries = [
    ...vaccines.perBaby,
    ...appointments.perBaby,
    ...medications.perBaby,
    ...milestones.perBaby,
  ].filter((entry) => !scope || entry.baby.id === scope)
  const isPending =
    babies.isPending ||
    entries.some((entry) => entry.isPending) ||
    specialists.isPending ||
    adhoc.isPending
  const isError =
    babies.isError || entries.some((entry) => entry.isError) || specialists.isError || adhoc.isError
  const scoped = <T extends { baby: { id: string } }>(values: T[]) =>
    values.filter((entry) => !scope || entry.baby.id === scope)
  const groups = groupByDomain(
    search({
      query,
      locale: i18n.language,
      doseLabel: t('search.ui.dose'),
      babies: (babies.data ?? []).filter((baby) => !scope || baby.id === scope),
      vaccines: scoped(vaccines.perBaby),
      appointments: scoped(appointments.perBaby),
      medications: scoped(medications.perBaby),
      milestones: scoped(milestones.perBaby),
      adhoc: adhoc.items,
      specialists: (specialists.data ?? []).filter(
        (item) => !scope || item.babyIds.includes(scope),
      ),
    }),
  )
  const go = (results: SearchResult[], child: string | null) => {
    useSelectedBabyStore.getState().select(child)
    useSearchDestinationStore
      .getState()
      .set({ path: results[0]!.to, keys: results.map((item) => item.key), query, babyId: child })
    onNavigate()
  }
  const retry = () =>
    void client.refetchQueries({
      predicate: (entry) =>
        entry.state.status === 'error' &&
        ['babies', 'specialists'].includes(String(entry.queryKey[0])),
      type: 'active',
    })
  const count = groups.reduce((sum, group) => sum + group.results.length, 0)
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3">
      {normalise(query).length < MIN_QUERY_LENGTH ? (
        <div className="px-4 py-10 text-center">
          <p className="font-semibold text-ink">{t('search.ui.start')}</p>
          <p className="mt-2 text-sm text-ink-muted">{t('search.hint')}</p>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
            {t('search.ui.examples')}
          </p>
        </div>
      ) : (
        <>
          <div role="status" aria-live="polite" className="px-3 py-2 text-xs text-ink-muted">
            {t('search.ui.results', { count })}
            {isPending && ` · ${t('search.loading')}`}
          </div>
          {isError && (
            <div role="alert" className="mx-2 mb-3 rounded-xl bg-muted px-3 py-2">
              <p className="text-sm text-ink-muted">
                {t(count ? 'search.partialError' : 'search.error')}
              </p>
              <button
                type="button"
                onClick={retry}
                className="min-h-11 text-sm font-semibold text-primary"
              >
                {t('nav.shell.retry')}
              </button>
            </div>
          )}
          {!count && !isPending && !isError && (
            <div className="px-4 py-8 text-center">
              <p className="break-words text-sm text-ink-muted">
                {t('search.noResults', { query })}
              </p>
              {scope && (
                <button
                  type="button"
                  onClick={onExpandScope}
                  className="mt-3 min-h-11 rounded-xl px-4 font-semibold text-primary hover:bg-muted"
                >
                  {t('search.ui.expand')}
                </button>
              )}
            </div>
          )}
          {groups.map((group) => {
            const Icon = DOMAIN_ICON[group.domain]
            return (
              <section key={group.domain} className="mb-3 last:mb-0">
                <h3 className="flex items-center justify-between px-3 py-2 text-xs font-bold text-ink-muted">
                  <span>{t(DOMAIN_LABEL[group.domain])}</span>
                  <span>{group.results.length}</span>
                </h3>
                <ul>
                  {group.results.slice(0, PER_DOMAIN_LIMIT).map((result) => (
                    <li key={result.key}>
                      <Link
                        data-search-result
                        to={result.to}
                        onClick={(event) => {
                          if (
                            !event.ctrlKey &&
                            !event.metaKey &&
                            !event.shiftKey &&
                            !event.altKey &&
                            event.button === 0
                          )
                            go([result], result.babyId ?? scope)
                        }}
                        className="flex min-h-16 items-start gap-3 rounded-xl px-3 py-3 hover:bg-muted focus-visible:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${DOMAIN_TONE[group.domain]}`}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block break-words text-sm font-semibold text-ink">
                            {result.title}
                          </span>
                          {result.subtitle && (
                            <span className="mt-0.5 block break-words text-xs text-ink-muted">
                              {result.subtitle}
                            </span>
                          )}
                          {result.detail && (
                            <span className="mt-1 block text-xs text-ink-muted">
                              {result.detail}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {group.results.length > PER_DOMAIN_LIMIT && (
                  <Link
                    data-search-result
                    to={group.results[0]!.to}
                    onClick={(event) => {
                      if (
                        !event.ctrlKey &&
                        !event.metaKey &&
                        !event.shiftKey &&
                        !event.altKey &&
                        event.button === 0
                      )
                        go(group.results, scope)
                    }}
                    className="mx-3 flex min-h-11 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-2"
                  >
                    {t('search.ui.more', {
                      count: group.results.length,
                      section: t(DOMAIN_LABEL[group.domain]),
                    })}
                  </Link>
                )}
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}
