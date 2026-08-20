import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ScheduleItem } from '../../src/shared/public-schedule'
import VaccineSchedule from '../VaccineSchedule'
import { runtimeProbe } from '../runtime-probe'
import { STYLE_ELEMENT_ID, STYLES } from '../styles'

const API_ORIGIN = 'https://cygnus.samuelsantana.dev/api'

const SCHEDULE: ScheduleItem[] = [
  { id: '1', name: 'BCG', description: 'Tuberculose', recommendedAgeInMonths: 0, doseNumber: 1 },
  { id: '2', name: 'Pentavalente', description: 'DTP + Hib + HepB', recommendedAgeInMonths: 2, doseNumber: 1 },
  { id: '3', name: 'Tríplice viral', description: 'Sarampo', recommendedAgeInMonths: 12, doseNumber: 1 },
]

function stubFetch(options: { fail?: boolean; schedule?: ScheduleItem[] } = {}) {
  // Typed with the parameters it is called with, not inferred from the body: the abort test reads
  // `mock.calls[0][1].signal`, and an argument-less `vi.fn` infers a zero-length tuple that makes
  // that index a type error rather than a value.
  const mock = vi.fn(async (_input: string, _init?: RequestInit) =>
    options.fail
      ? { ok: false, status: 503, json: async () => ({}) }
      : { ok: true, status: 200, json: async () => ({ schedule: options.schedule ?? SCHEDULE }) },
  )
  vi.stubGlobal('fetch', mock)
  return mock
}

afterEach(() => {
  vi.unstubAllGlobals()
  document.getElementById(STYLE_ELEMENT_ID)?.remove()
})

describe('VaccineSchedule', () => {
  it('renders the schedule once loaded', async () => {
    stubFetch()

    render(<VaccineSchedule apiOrigin={API_ORIGIN} />)

    expect(screen.getByText(/Carregando o calendário vacinal/)).toBeInTheDocument()
    expect(await screen.findByText('BCG')).toBeInTheDocument()
    expect(screen.getByText('Ao nascer')).toBeInTheDocument()
    expect(screen.getByText('1 ano')).toBeInTheDocument()
  })

  it('honours the row cap', async () => {
    stubFetch()

    render(<VaccineSchedule apiOrigin={API_ORIGIN} limit={2} />)

    expect(await screen.findByText('BCG')).toBeInTheDocument()
    expect(screen.queryByText('Tríplice viral')).not.toBeInTheDocument()
  })

  it('reports a failure and recovers on retry', async () => {
    const user = userEvent.setup()
    const failing = stubFetch({ fail: true })

    render(<VaccineSchedule apiOrigin={API_ORIGIN} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/Não foi possível carregar/)
    expect(screen.getByText('HTTP 503')).toBeInTheDocument()
    expect(failing).toHaveBeenCalledTimes(1)

    stubFetch()
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByText('BCG')).toBeInTheDocument()
  })

  it('hands a selection to the host instead of navigating', async () => {
    // The remote runs inside the host's React tree, so it *could* reach the host's router. Not
    // doing so is the contract: a widget that can move the page it sits in is one nobody mounts.
    const user = userEvent.setup()
    const onSelect = vi.fn()
    stubFetch()

    render(<VaccineSchedule apiOrigin={API_ORIGIN} onSelect={onSelect} />)

    await user.click(await screen.findByRole('button', { name: 'BCG' }))

    expect(onSelect).toHaveBeenCalledWith(SCHEDULE[0])
  })

  it('renders plain text, not a control, when the host offers no handler', async () => {
    stubFetch()

    render(<VaccineSchedule apiOrigin={API_ORIGIN} />)

    expect(await screen.findByText('BCG')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'BCG' })).not.toBeInTheDocument()
  })

  it('injects its stylesheet exactly once across instances', async () => {
    stubFetch()

    render(
      <>
        <VaccineSchedule apiOrigin={API_ORIGIN} />
        <VaccineSchedule apiOrigin={API_ORIGIN} />
      </>,
    )

    await waitFor(() => expect(document.querySelectorAll(`#${STYLE_ELEMENT_ID}`)).toHaveLength(1))
  })

  it('aborts the in-flight request when unmounted', async () => {
    const mock = stubFetch()
    const { unmount } = render(<VaccineSchedule apiOrigin={API_ORIGIN} />)

    await waitFor(() => expect(mock).toHaveBeenCalled())
    const signal = mock.mock.calls[0]?.[1]?.signal as AbortSignal | undefined

    unmount()

    expect(signal?.aborted).toBe(true)
  })
})

describe('styles', () => {
  it('scopes every selector under the remote prefix', () => {
    // This markup lands in a document whose CSS this project has never seen. A bare element or
    // `:root` selector here would restyle the host's page, which is the one thing a federated
    // widget is never allowed to do.
    const selectors = STYLES.split('}')
      .map((block) => block.split('{')[0]?.trim() ?? '')
      .filter((selector) => selector.length > 0 && !selector.startsWith('@'))

    for (const selector of selectors) {
      expect(selector, `"${selector}" escapes the cygnus-mf- prefix`).toMatch(/\.cygnus-mf-/)
    }
  })
})

describe('runtimeProbe', () => {
  it('reports references a host can compare, not just a version string', async () => {
    const React = await import('react')
    const probe = runtimeProbe()

    expect(probe.reactVersion).toBe(React.version)
    // In-process, so of course these match — the assertion documents what the host checks across
    // the federation boundary, where a failed negotiation makes them two different functions.
    expect(probe.useState).toBe(React.useState)
    expect(probe.createElement).toBe(React.createElement)
  })
})
