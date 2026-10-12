import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCountUp } from './useCountUp'

function allowMotion(allowed: boolean) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: allowed, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
}

describe('useCountUp', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('counts from zero to the value when motion is welcome, and on from there when it changes', () => {
    allowMotion(true)
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    const { result, rerender } = renderHook(({ value }) => useCountUp(value, 900), { initialProps: { value: 62 } })

    expect(result.current).toBe(0)
    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBeGreaterThan(0)
    expect(result.current).toBeLessThan(62)
    act(() => vi.advanceTimersByTime(700))
    expect(result.current).toBe(62)

    rerender({ value: 64 })
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current).toBe(64)
  })

  it('is simply the value under reduced motion', () => {
    allowMotion(false)
    const { result } = renderHook(() => useCountUp(62))

    expect(result.current).toBe(62)
  })

  it('is simply the value where the preference cannot be read', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { result } = renderHook(() => useCountUp(62))

    expect(result.current).toBe(62)
  })
})
