import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useAllBabiesAppointments } from '@/features/appointments/api/appointments.hooks'
import { useBabies } from '@/features/babies/api/babies.hooks'
import { useAllBabiesMedications } from '@/features/medications/api/medications.hooks'
import { useAllBabiesMilestones } from '@/features/milestones/api/milestones.hooks'
import { useSpecialists } from '@/features/specialists/api/specialists.hooks'
import { useAllBabiesVaccineCalendars } from '@/features/vaccines/api/vaccines.hooks'
import { DashboardIcon } from '@/shared/icons/dashboard-icon'
import { HeartIcon } from '@/shared/icons/heart-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'
import { UsersIcon } from '@/shared/icons/users-icon'

import { groupByDomain, MIN_QUERY_LENGTH, normalise, search, type SearchDomain } from '../search'

/**
 * Rows shown per section before the list defers to the section itself.
 *
 * A household with three children matches the same word across a hundred
 * calendar doses, and a dialog that renders all of them is neither readable nor
 * cheap. Eight is what fits above the fold beside a second section's heading,
 * which is the thing worth seeing: that the word also matched somewhere else.
 */
const PER_DOMAIN_LIMIT = 8

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

interface SearchResultsListProps {
  query: string
  onNavigate: () => void
}

/**
 * The results, and the six queries behind them.
 *
 * **This component is mounted only while the dialog is open**, which is the
 * whole strategy: the hooks it calls are the same aggregate hooks the pages use,
 * with no `enabled` flag to pass, so mounting it in the shell would fetch every
 * child's vaccines, appointments, medications and milestones on every page of
 * the app. Mounted on open, the cost is one fetch per domain the first time
 * someone searches, and cache afterwards.
 *
 * Searching what is already loaded is also a safety property, not only a
 * performance one: there is no search endpoint, and adding one would be a second
 * implementation of every domain's visibility rules — the class of bug that
 * shows one family another family's data. A result here can only be something
 * the reader could have reached by walking the app.
 */
export function SearchResultsList({ query, onNavigate }: SearchResultsListProps) {
  const { t } = useTranslation()
  const babies = useBabies()
  const vaccines = useAllBabiesVaccineCalendars()
  const appointments = useAllBabiesAppointments()
  const medications = useAllBabiesMedications()
  const milestones = useAllBabiesMilestones()
  const specialists = useSpecialists()

  const isPending =
    babies.isPending ||
    vaccines.isPending ||
    appointments.isPending ||
    medications.isPending ||
    milestones.isPending ||
    specialists.isPending

  // Any one of the six failing means the search saw less than the account holds.
  const isError =
    babies.isError ||
    vaccines.isError ||
    appointments.isError ||
    medications.isError ||
    milestones.isError ||
    specialists.isError

  // Not memoised, and that is the honest version: every one of these inputs is a
  // fresh array on every render — the aggregate hooks build `perBaby` with
  // `babyList.map(...)` each time they run — so a `useMemo` over them recomputes
  // on every render anyway. It would read like a performance guarantee and be
  // decoration. The work it saves is a substring scan over a few hundred rows,
  // which is microseconds; the memo would cost a reader the assumption that
  // something here is expensive.
  const groups = groupByDomain(
    search({
      query,
      babies: babies.data ?? [],
      vaccines: vaccines.perBaby.map((entry) => ({ baby: entry.baby, items: entry.items })),
      appointments: appointments.perBaby.map((entry) => ({ baby: entry.baby, items: entry.items })),
      medications: medications.perBaby.map((entry) => ({ baby: entry.baby, items: entry.items })),
      milestones: milestones.perBaby.map((entry) => ({ baby: entry.baby, items: entry.items })),
      specialists: specialists.data ?? [],
    }),
  )

  if (normalise(query).length < MIN_QUERY_LENGTH) {
    return <p className="px-4 py-10 text-center text-sm text-ink-faint">{t('search.hint')}</p>
  }

  // Pending is checked *after* the query length, so an empty field never shows a
  // spinner for six requests nobody asked for yet.
  if (isPending) {
    return <p className="px-4 py-10 text-center text-sm text-ink-faint">{t('search.loading')}</p>
  }

  // Said before "nothing found", never instead of it. A list that failed to load
  // matches nothing, so the honest-looking sentence — "nada encontrado para
  // fernanda" — is a lie about data that is sitting there. This was found by a
  // test whose fixture broke one response's parse: the dialog reported an empty
  // search with a straight face.
  if (isError && groups.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-ink-muted">{t('search.error')}</p>
  }

  if (groups.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-ink-muted">{t('search.noResults', { query })}</p>
  }

  return (
    // Its own scroller with a ceiling: a search for "a" — well, for two letters
    // that match everything — must not grow the dialog past the viewport, which
    // on a phone would put the field itself off screen.
    <div className="max-h-[60vh] overflow-y-auto">
      {groups.map((group) => {
        const Icon = DOMAIN_ICON[group.domain]

        return (
          <section key={group.domain} className="border-b border-border last:border-0">
            <h3 className="px-4 pt-4 pb-2 text-[11px] font-bold tracking-wide text-ink-faint uppercase">
              {t(DOMAIN_LABEL[group.domain])}
            </h3>
            <ul>
              {group.results.slice(0, PER_DOMAIN_LIMIT).map((result) => (
                <li key={result.key}>
                  <Link
                    to={result.to}
                    onClick={onNavigate}
                    className="flex min-h-11 items-center gap-3 px-4 py-2 transition-colors hover:bg-muted"
                  >
                    <Icon className="h-4 w-4 flex-shrink-0 text-ink-faint" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">{result.title}</span>
                      {result.subtitle && (
                        <span className="block truncate text-xs text-ink-muted">{result.subtitle}</span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {group.results.length > PER_DOMAIN_LIMIT && (
              <Link
                to={group.results[0]!.to}
                onClick={onNavigate}
                className="flex min-h-11 items-center px-4 py-2 text-xs font-semibold text-primary hover:underline"
              >
                {t('search.more', {
                  count: group.results.length - PER_DOMAIN_LIMIT,
                  section: t(DOMAIN_LABEL[group.domain]),
                })}
              </Link>
            )}
          </section>
        )
      })}

      {/* Results *and* a failure: what is listed is real, and there may be more
          that was never read. Saying nothing here would present a partial answer
          as a complete one. */}
      {isError && <p className="px-4 py-3 text-xs text-ink-faint">{t('search.partialError')}</p>}
    </div>
  )
}
