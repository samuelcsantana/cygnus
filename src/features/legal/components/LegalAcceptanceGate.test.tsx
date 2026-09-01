import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'


/**
 * The gate has two states and both need proving, because the one that ships
 * today is "does nothing" — and a component that does nothing is
 * indistinguishable from a component that is broken.
 *
 * `LEGAL_DOCUMENTS` is mocked per test rather than read from disk: the real
 * module has both documents as drafts, so without mocking there would be no way
 * to exercise the half that matters on the day a text is published.
 */
const asDrafts = {
  privacy: { id: 'privacy', version: '0.1.0-draft', effectiveFrom: '2026-08-26', status: 'draft', path: '/privacidade' },
  terms: { id: 'terms', version: '0.1.0-draft', effectiveFrom: '2026-08-26', status: 'draft', path: '/termos' },
} as const

const inForce = {
  privacy: { id: 'privacy', version: '1.0.0', effectiveFrom: '2026-09-01', status: 'in-force', path: '/privacidade' },
  terms: { id: 'terms', version: '1.0.0', effectiveFrom: '2026-09-01', status: 'in-force', path: '/termos' },
} as const

async function gateWithDocuments(documents: unknown) {
  vi.resetModules()
  vi.doMock('@/shared/legal', async (importOriginal) => {
    const original = await importOriginal<typeof import('@/shared/legal')>()
    return { ...original, LEGAL_DOCUMENTS: documents }
  })
  const mod = await import('./LegalAcceptanceGate')
  return mod.LegalAcceptanceGate
}

describe('LegalAcceptanceGate', () => {
  it('renders the app untouched while every document is a draft, and asks the API nothing', async () => {
    let requests = 0
    server.use(
      http.get(`${config.apiBaseUrl}/legal/acceptances`, () => {
        requests += 1
        return HttpResponse.json([])
      }),
    )

    const Gate = await gateWithDocuments(asDrafts)
    renderWithProviders(
      <MemoryRouter>
        <Gate>
          <p>app content</p>
        </Gate>
      </MemoryRouter>,
    )

    expect(await screen.findByText('app content')).toBeInTheDocument()
    // Not merely "no gate": no request either. Asking someone to accept a draft
    // would be asking them to agree to text nobody has stood behind.
    expect(requests).toBe(0)
  })

  it('blocks the app when a document is in force and has not been accepted', async () => {
    server.use(http.get(`${config.apiBaseUrl}/legal/acceptances`, () => HttpResponse.json([])))

    const Gate = await gateWithDocuments(inForce)
    renderWithProviders(
      <MemoryRouter>
        <Gate>
          <p>app content</p>
        </Gate>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Antes de continuar' })).toBeInTheDocument()
    expect(screen.queryByText('app content')).not.toBeInTheDocument()
  })

  it('lets the app through once the current version of each document is accepted', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/legal/acceptances`, () =>
        HttpResponse.json([
          { documentId: 'privacy', version: '1.0.0', acceptedAt: '2026-09-01T10:00:00.000Z' },
          { documentId: 'terms', version: '1.0.0', acceptedAt: '2026-09-01T10:00:00.000Z' },
        ]),
      ),
    )

    const Gate = await gateWithDocuments(inForce)
    renderWithProviders(
      <MemoryRouter>
        <Gate>
          <p>app content</p>
        </Gate>
      </MemoryRouter>,
    )

    expect(await screen.findByText('app content')).toBeInTheDocument()
  })

  it('asks again when the accepted version is not the one in force', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/legal/acceptances`, () =>
        HttpResponse.json([
          { documentId: 'privacy', version: '0.9.0', acceptedAt: '2026-08-01T10:00:00.000Z' },
          { documentId: 'terms', version: '1.0.0', acceptedAt: '2026-09-01T10:00:00.000Z' },
        ]),
      ),
    )

    const Gate = await gateWithDocuments(inForce)
    renderWithProviders(
      <MemoryRouter>
        <Gate>
          <p>app content</p>
        </Gate>
      </MemoryRouter>,
    )

    // An acceptance of 0.9.0 does not satisfy 1.0.0. Without this, a text change
    // would silently inherit an agreement to words the person never read.
    expect(await screen.findByRole('heading', { name: 'Antes de continuar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Termos de Uso' })).not.toBeInTheDocument()
  })

  it('does not lock anyone out when the query fails', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/legal/acceptances`, () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    )

    const Gate = await gateWithDocuments(inForce)
    renderWithProviders(
      <MemoryRouter>
        <Gate>
          <p>app content</p>
        </Gate>
      </MemoryRouter>,
    )

    // The gate collects consent; it does not hold a health record hostage to a
    // network hiccup.
    await waitFor(() => {
      expect(screen.getByText('app content')).toBeInTheDocument()
    })
  })
})
