import { describe, expect, it } from 'vitest'

import { LEGAL_DOCUMENTS, type LegalDocumentId } from '@/shared/legal'

import { legalContent, sectionsAwaitingReview } from './index'

const IDS: LegalDocumentId[] = ['privacy', 'terms']

describe('legal documents', () => {
  /**
   * The one that matters. Everything else in this file is hygiene; this is the
   * failure the whole arrangement exists to prevent.
   *
   * A document reaches `in-force` by a human editing `shared/legal.ts`. If they
   * flip the status without having replaced every section marked `needsReview`,
   * the app starts presenting placeholder prose as a binding policy — and asks
   * people to accept it. Nothing else would catch that: the page renders, the
   * types check, and the text looks like text.
   */
  it.each(IDS)('%s never reaches in-force with a section still awaiting review', (id) => {
    if (LEGAL_DOCUMENTS[id].status !== 'in-force') return

    expect(sectionsAwaitingReview(id)).toEqual([])
  })

  it.each(IDS)('%s has a draft version while it is a draft', (id) => {
    const doc = LEGAL_DOCUMENTS[id]
    if (doc.status !== 'draft') return

    // The suffix is what makes an unreviewed version unmistakable in the
    // acceptance record on the API side, where there is no `status` column.
    expect(doc.version).toMatch(/-draft$/)
  })

  it.each(IDS)('%s has unique, non-empty section ids', (id) => {
    const ids = legalContent(id).sections.map((section) => section.id)

    expect(ids.every((sectionId) => sectionId.length > 0)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(IDS)('%s has no empty section', (id) => {
    for (const section of legalContent(id).sections) {
      expect(section.heading.trim().length).toBeGreaterThan(0)
      expect(section.body.length).toBeGreaterThan(0)
      expect(section.body.every((paragraph) => paragraph.trim().length > 0)).toBe(true)
    }
  })

  it('still has sections awaiting review, which is why both are drafts', () => {
    // Not a tautology: if someone replaces the text and forgets to flip the
    // status, this turns red and says so, rather than leaving a finished policy
    // silently labelled a draft.
    expect(sectionsAwaitingReview('privacy').length).toBeGreaterThan(0)
    expect(sectionsAwaitingReview('terms').length).toBeGreaterThan(0)
    expect(LEGAL_DOCUMENTS.privacy.status).toBe('draft')
    expect(LEGAL_DOCUMENTS.terms.status).toBe('draft')
  })
})
