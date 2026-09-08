import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useLocalToday } from './useLocalToday'
afterEach(() => vi.useRealTimers())
it('updates at local midnight without reloading the page', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-07T23:59:59-03:00'))
  const { result, unmount } = renderHook(() => useLocalToday())
  expect(result.current).toBe('2026-09-07')
  act(() => vi.advanceTimersByTime(1100))
  expect(result.current).toBe('2026-09-08')
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})
