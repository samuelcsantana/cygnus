import { afterEach, describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/test-utils'

import { BrandSignature } from './BrandSignature'

describe('BrandSignature', () => {
  afterEach(() => window.sessionStorage.clear())

  it('folds the mark on the first screen of a visit and never again', () => {
    const first = renderWithProviders(<BrandSignature />)
    expect(first.container.querySelector('svg[data-mark-fold]')).not.toBeNull()
    first.unmount()

    const next = renderWithProviders(<BrandSignature />)
    expect(next.container.querySelector('svg')).not.toBeNull()
    expect(next.container.querySelector('svg[data-mark-fold]')).toBeNull()
  })

  it('folds both signatures shown on the same first screen alike', () => {
    const { container } = renderWithProviders(
      <>
        <BrandSignature inverse />
        <BrandSignature />
      </>,
    )

    expect(container.querySelectorAll('svg[data-mark-fold]')).toHaveLength(2)
  })
})
