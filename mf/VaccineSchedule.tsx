import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  APP_ORIGIN,
  DEFAULT_API_ORIGIN,
  fetchPublicSchedule,
  formatAge,
  type ScheduleItem,
} from '../src/shared/public-schedule'

import { STYLE_ELEMENT_ID, STYLES } from './styles'

export interface VaccineScheduleProps {
  /** Origin serving the Cygnus API. The default is absolute because this renders on someone else's origin. */
  apiOrigin?: string
  /** Cap on rows. The full PNI schedule is 28 doses; a panel in a host page rarely wants all of them. */
  limit?: number
  /**
   * Called when a visitor activates a row.
   *
   * The remote never navigates the host — same rule the embed follows, and it matters more here, not
   * less: this component runs *inside* the host's React tree, so it could call the host's router
   * directly if it went looking for one. A callback keeps the host in charge of what a click means.
   */
  onSelect?: (item: ScheduleItem) => void
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; schedule: ScheduleItem[] }
  | { status: 'failed'; reason: string }

/**
 * Styles are injected once into the host document rather than shipped as a CSS asset.
 *
 * Federated CSS is genuinely unsolved: the container hands the host a JavaScript module, and a
 * stylesheet emitted alongside it is the host's problem to discover and load — which is exactly the
 * kind of implicit contract that breaks a month later when the host changes bundler. Every class
 * here is `cygnus-mf-` prefixed for the same reason: this markup lands in a document whose CSS this
 * project has never seen.
 *
 * The embed solves the same problem with a shadow root, which is stronger. It is not available here
 * on purpose — a shadow root would also cut the component off from the host's React tree, and being
 * part of that tree is the entire point of federating rather than embedding.
 */
function useInjectedStyles(): void {
  useEffect(() => {
    if (document.getElementById(STYLE_ELEMENT_ID)) return

    const style = document.createElement('style')
    style.id = STYLE_ELEMENT_ID
    style.textContent = STYLES
    document.head.appendChild(style)

    // Not removed on unmount: a second instance mounting while the first unmounts would otherwise
    // leave the survivor unstyled. The element is idempotent and ~1 kB — leaking it is the cheaper
    // of the two failures.
  }, [])
}

/**
 * The Brazilian PNI immunization schedule, exposed as a Module Federation remote.
 *
 * This is a real component from a real application, not a demo: it fetches over the network, holds
 * state, cancels in flight, and renders three distinct outcomes. That is deliberate — a federated
 * `<div>Hello</div>` proves the plumbing and nothing about whether the plumbing is usable.
 *
 * It is also the only screen in Cygnus that *can* be federated to an anonymous visitor. The other
 * six features are scoped to a signed-in guardian and a specific baby; the PNI schedule is published
 * policy, identical for everyone, and reachable through the single unauthenticated endpoint the API
 * exposes.
 */
export default function VaccineSchedule({
  apiOrigin = DEFAULT_API_ORIGIN,
  limit = 8,
  onSelect,
}: VaccineScheduleProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  useInjectedStyles()

  useEffect(() => {
    const controller = new AbortController()
    abortRef.current = controller
    setState({ status: 'loading' })

    fetchPublicSchedule(apiOrigin, controller.signal)
      .then((schedule) => setState({ status: 'ready', schedule }))
      .catch((error: unknown) => {
        // An abort is this component being unmounted or retried, not a failure to report.
        if (controller.signal.aborted) return
        setState({ status: 'failed', reason: error instanceof Error ? error.message : 'unknown' })
      })

    return () => controller.abort()
  }, [apiOrigin, attempt])

  const visible = useMemo(
    () => (state.status === 'ready' ? state.schedule.slice(0, limit) : []),
    [state, limit],
  )

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  if (state.status === 'loading') {
    return (
      <div className="cygnus-mf-card" aria-busy="true">
        <p className="cygnus-mf-state">Carregando o calendário vacinal…</p>
      </div>
    )
  }

  if (state.status === 'failed') {
    return (
      <div className="cygnus-mf-card" role="alert">
        <p className="cygnus-mf-state cygnus-mf-error">Não foi possível carregar o calendário vacinal.</p>
        <p className="cygnus-mf-reason">{state.reason}</p>
        <button type="button" className="cygnus-mf-retry" onClick={retry}>
          Tentar de novo
        </button>
      </div>
    )
  }

  return (
    <div className="cygnus-mf-card">
      <p className="cygnus-mf-title">Calendário vacinal</p>
      <p className="cygnus-mf-subtitle">
        Programa Nacional de Imunizações — primeiras {visible.length} doses
      </p>

      <ul className="cygnus-mf-list">
        {visible.map((item) => (
          <li key={item.id} className="cygnus-mf-row">
            <span className="cygnus-mf-age">{formatAge(item.recommendedAgeInMonths)}</span>
            <div className="cygnus-mf-detail">
              {onSelect ? (
                <button type="button" className="cygnus-mf-name-button" onClick={() => onSelect(item)}>
                  {item.name}
                </button>
              ) : (
                <p className="cygnus-mf-name">{item.name}</p>
              )}
              <p className="cygnus-mf-dose">{item.doseNumber}ª dose</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="cygnus-mf-footer">
        <a href={APP_ORIGIN} target="_blank" rel="noreferrer noopener">
          Acompanhar as vacinas do seu bebê →
        </a>
      </p>
    </div>
  )
}
