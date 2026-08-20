/**
 * The `GET /public/vaccine-schedule` contract, shared by every artifact that reads it from outside
 * the application shell: the embed's two distribution variants and the Module Federation remote.
 *
 * It lives here, and not in `features/vaccines/api`, because that layer speaks the authenticated
 * API — `httpClient` attaches credentials, and its schemas describe a *baby's* calendar, which has
 * status, dates and photos. This endpoint answers something else entirely: the PNI schedule as
 * published policy, identical for every visitor and readable with no session at all.
 *
 * **Zero dependencies, on purpose.** The embed ships ~2.5 kB gzip precisely because it pulls in
 * neither Zod nor the HTTP client, so anything shared with it has to hold that line. The validation
 * below is hand-written for the same reason — it is a narrowing guard, not a schema library.
 */

export interface ScheduleItem {
  id: string
  name: string
  description: string
  recommendedAgeInMonths: number
  doseNumber: number
}

/** The origin serving the Cygnus API, overridable so one build works in dev, on a preview and in production. */
export const DEFAULT_API_ORIGIN = 'https://cygnus.samuelsantana.dev/api'

/** Where a reader is sent to act on what the widget shows. Never navigated to by the widget itself. */
export const APP_ORIGIN = 'https://cygnus.samuelsantana.dev'

function isScheduleItem(value: unknown): value is ScheduleItem {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.description === 'string' &&
    typeof item.recommendedAgeInMonths === 'number' &&
    typeof item.doseNumber === 'number'
  )
}

/**
 * Fetches the schedule and drops anything that does not match the shape above.
 *
 * Filtering rather than throwing is the deliberate choice: this data is a list of independent rows,
 * so one malformed row is not a reason to show a visitor an error instead of the other twenty-seven.
 * A response that is not a list at all *is* — that means the endpoint changed shape, not that a row
 * is bad.
 */
export async function fetchPublicSchedule(apiOrigin: string, signal?: AbortSignal): Promise<ScheduleItem[]> {
  const response = await fetch(`${apiOrigin}/public/vaccine-schedule`, {
    // No cookies, ever. The endpoint answers `Access-Control-Allow-Origin: *` without
    // `Allow-Credentials`, so a browser would refuse the pairing anyway — being explicit documents
    // that nothing reading this contract can reach anyone's session.
    credentials: 'omit',
    signal,
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const body: unknown = await response.json()
  const schedule = (body as { schedule?: unknown })?.schedule

  if (!Array.isArray(schedule)) throw new Error('malformed response: `schedule` is not a list')

  return schedule.filter(isScheduleItem)
}

/**
 * Ages as the PNI publishes them — "Ao nascer", months up to the first year, years after that.
 *
 * Portuguese without going through i18next, because the two consumers of this module have no
 * translation runtime: the embed refuses one by design, and the federated remote would have to
 * either ship a second i18n instance or negotiate one with a host that may not have it.
 */
export function formatAge(months: number): string {
  if (months === 0) return 'Ao nascer'
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`
  const years = months / 12
  const rounded = Number.isInteger(years) ? years : Math.round(years * 10) / 10
  return `${rounded} ${rounded === 1 ? 'ano' : 'anos'}`
}
