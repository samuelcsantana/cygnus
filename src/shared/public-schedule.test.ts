import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchPublicSchedule, formatAge, type ScheduleItem } from './public-schedule'

const API_ORIGIN = 'https://cygnus.samuelsantana.dev/api'

const VALID: ScheduleItem = {
  id: '1',
  name: 'BCG',
  description: 'Tuberculose',
  recommendedAgeInMonths: 0,
  doseNumber: 1,
}

function stubResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const fetchMock = vi.fn(async () => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchPublicSchedule', () => {
  it('never sends credentials', async () => {
    // The endpoint answers `Access-Control-Allow-Origin: *`. A browser refuses to attach cookies to
    // a wildcard origin, so this assertion is not what makes the call safe — it is what keeps the
    // intent visible to whoever edits this next.
    const fetchMock = stubResponse({ schedule: [VALID] })

    await fetchPublicSchedule(API_ORIGIN)

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_ORIGIN}/public/vaccine-schedule`,
      expect.objectContaining({ credentials: 'omit' }),
    )
  })

  it('drops malformed rows and keeps the rest', async () => {
    stubResponse({
      schedule: [
        VALID,
        { id: '2', name: 'Hepatite B' }, // missing three fields
        { ...VALID, id: '3', recommendedAgeInMonths: '2' }, // right key, wrong type
        null,
        { ...VALID, id: '4' },
      ],
    })

    const schedule = await fetchPublicSchedule(API_ORIGIN)

    expect(schedule.map((item) => item.id)).toEqual(['1', '4'])
  })

  it('throws when the envelope itself is wrong, rather than rendering an empty schedule', async () => {
    // A missing `schedule` key means the endpoint changed shape. Silently showing zero vaccines
    // would be the worst outcome available: a visitor cannot tell it apart from a real answer.
    stubResponse({ items: [VALID] })

    await expect(fetchPublicSchedule(API_ORIGIN)).rejects.toThrow(/not a list/)
  })

  it('throws on a non-2xx response', async () => {
    stubResponse({}, { ok: false, status: 503 })

    await expect(fetchPublicSchedule(API_ORIGIN)).rejects.toThrow('HTTP 503')
  })

  it('forwards an abort signal', async () => {
    const fetchMock = stubResponse({ schedule: [] })
    const controller = new AbortController()

    await fetchPublicSchedule(API_ORIGIN, controller.signal)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    )
  })
})

describe('formatAge', () => {
  it.each([
    [0, 'Ao nascer'],
    [1, '1 mês'],
    [2, '2 meses'],
    [11, '11 meses'],
    [12, '1 ano'],
    [15, '1.3 anos'],
    [24, '2 anos'],
    [48, '4 anos'],
  ])('formats %i months as "%s"', (months, expected) => {
    expect(formatAge(months)).toBe(expected)
  })
})
