import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { legalContent } from '@/features/legal/content'
import i18n from '@/lib/i18n'
import { renderWithProviders, screen, within } from '@/test/test-utils'

import { LegalDocumentRoute } from './LegalDocumentRoute'

function renderDocument(documentId: 'privacy' | 'terms') {
  return renderWithProviders(
    <MemoryRouter>
      <LegalDocumentRoute documentId={documentId} />
    </MemoryRouter>,
  )
}

describe('LegalDocumentRoute', () => {
  afterEach(async () => {
    await i18n.changeLanguage('pt-BR')
  })

  it('shows the document in force, every section of it, and the way to the other one', () => {
    renderDocument('privacy')

    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { level: 1, name: 'Política de Privacidade' })).toBeInTheDocument()
    expect(within(main).getByText('Versão 1.1.0 · em vigor a partir de 12/10/2026')).toBeInTheDocument()
    // In force, so no draft warning.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    const sections = legalContent('privacy').sections
    expect(within(main).getAllByRole('heading', { level: 2 })).toHaveLength(sections.length)
    expect(within(main).getByRole('link', { name: 'Termos de Uso' })).toHaveAttribute('href', '/termos')
  })

  it('links back from the terms to the privacy policy', () => {
    renderDocument('terms')

    expect(screen.getByRole('heading', { level: 1, name: 'Termos de Uso' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute('href', '/privacidade')
  })

  // The text binds in Portuguese. A reader who switched the interface to English sees the same text
  // with a note saying why, rather than a translation that would not be the agreed one.
  it('says the Portuguese text is the binding one when the interface is in another language', async () => {
    await i18n.changeLanguage('en')
    renderDocument('privacy')

    expect(
      screen.getByText(
        'This document is published in Portuguese, which is the language in which it binds. Translating this interface does not change the agreed text.',
      ),
    ).toBeInTheDocument()
  })
})
