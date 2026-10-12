import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders, screen } from '@/test/test-utils'

import { ServerWakingNotice } from './ServerWakingNotice'

describe('ServerWakingNotice', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('says nothing while a request is quick, and explains the wait once it is not', () => {
    const { rerender } = renderWithProviders(<ServerWakingNotice active />)

    act(() => vi.advanceTimersByTime(1400))
    expect(screen.queryByText('Acordando o servidor')).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(200))
    expect(screen.getByRole('status')).toHaveTextContent('Acordando o servidor')

    rerender(<ServerWakingNotice active={false} />)
    act(() => vi.advanceTimersByTime(0))
    expect(screen.queryByText('Acordando o servidor')).not.toBeInTheDocument()
  })

  it('keeps the live region in the page even while empty, so the text is announced when it arrives', () => {
    renderWithProviders(<ServerWakingNotice active={false} />)

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
