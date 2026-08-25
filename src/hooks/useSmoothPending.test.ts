import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSmoothPending } from './useSmoothPending'

describe('useSmoothPending', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const render = () =>
    renderHook(({ pending }) => useSmoothPending(pending, { delay: 400, minDuration: 400 }), {
      initialProps: { pending: false },
    })

  it('shows nothing for a request that answers inside the delay', () => {
    const { result, rerender } = render()

    rerender({ pending: true })
    act(() => {
      vi.advanceTimersByTime(80)
    })
    rerender({ pending: false })

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current).toBe(false)
  })

  it('shows the indicator once the request outlives the delay', () => {
    const { result, rerender } = render()

    rerender({ pending: true })
    act(() => {
      vi.advanceTimersByTime(399)
    })
    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe(true)
  })

  it('holds the indicator for the minimum once it is up', () => {
    const { result, rerender } = render()

    rerender({ pending: true })
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(result.current).toBe(true)

    // Answered 20ms after it appeared: hiding now would be the same blink,
    // one step later.
    act(() => {
      vi.advanceTimersByTime(20)
    })
    rerender({ pending: false })
    act(() => {
      vi.advanceTimersByTime(379)
    })
    expect(result.current).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe(false)
  })

  it('hides immediately when the minimum has already elapsed', () => {
    const { result, rerender } = render()

    rerender({ pending: true })
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current).toBe(true)

    rerender({ pending: false })
    act(() => {
      vi.advanceTimersByTime(0)
    })
    expect(result.current).toBe(false)
  })
})
