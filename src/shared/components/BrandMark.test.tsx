import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/test-utils'

import { BRAND_MARK_FACES, BRAND_MARK_SKY, BRAND_MARK_STAR_FILL, BRAND_MARK_STARS } from '@/shared/brand-mark'

import { BrandMark } from './BrandMark'

// public/favicon.svg is the source of every PNG icon, and BrandMark draws the same mark in the app.
// If someone redraws one and not the other, the browser tab and the installed app stop matching the
// screen, and nothing else would notice.
const favicon = readFileSync(resolve(process.cwd(), 'public/favicon.svg'), 'utf8')
const all = (re: RegExp) => [...favicon.matchAll(re)].map((m) => m[1])

describe('BrandMark', () => {
  it('draws the same faces, stars and sky as public/favicon.svg', () => {
    expect(all(/<polygon points="([^"]+)"/g)).toEqual(BRAND_MARK_FACES.map((f) => f.points))
    expect(all(/<polygon points="[^"]+" fill="([^"]+)"/g)).toEqual(BRAND_MARK_FACES.map((f) => f.fill))
    expect(all(/<path d="([^"]+)"/g)).toEqual([...BRAND_MARK_STARS])
    expect(all(/<path d="[^"]+" fill="([^"]+)"/g)).toEqual(BRAND_MARK_STARS.map(() => BRAND_MARK_STAR_FILL))
    expect(all(/stop-color="([^"]+)"/g)).toEqual([...BRAND_MARK_SKY])
  })

  it('gives each instance its own gradient id, safe inside url(#…)', () => {
    const { container } = renderWithProviders(
      <>
        <BrandMark />
        <BrandMark />
      </>,
    )
    const ids = [...container.querySelectorAll('linearGradient')].map((g) => g.id)
    expect(new Set(ids).size).toBe(2)
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]+$/)
    const fills = [...container.querySelectorAll('rect')].map((r) => r.getAttribute('fill'))
    expect(fills).toEqual(ids.map((id) => `url(#${id})`))
  })

  it('stays out of the accessibility tree', () => {
    const { container } = renderWithProviders(<BrandMark />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
