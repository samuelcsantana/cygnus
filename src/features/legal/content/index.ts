import type { LegalDocumentId } from '@/shared/legal'

import { privacyPtBR } from './privacy.pt-BR'
import { termsPtBR } from './terms.pt-BR'
import type { LegalContent } from './types'

export { BINDING_LOCALE } from './types'
export type { LegalContent, LegalSection } from './types'

/**
 * The one place that maps a document to its text.
 *
 * There is a single locale on purpose. The document is governed by Brazilian
 * law and binds in Portuguese; publishing an English and a Spanish "version"
 * would mean three texts to review and three chances for them to disagree about
 * what was agreed to. The other locales render this text with a notice saying
 * which language binds — which is what the page does, rather than pretending.
 */
const CONTENT: Record<LegalDocumentId, LegalContent> = {
  privacy: privacyPtBR,
  terms: termsPtBR,
}

export function legalContent(documentId: LegalDocumentId): LegalContent {
  return CONTENT[documentId]
}

/**
 * How many sections still need a human before the document can leave `draft`.
 *
 * Used by the page to say so out loud, and by a test to keep `status:
 * 'in-force'` and an unreviewed section from ever coexisting — that pairing is
 * the failure this whole arrangement exists to prevent.
 */
export function sectionsAwaitingReview(documentId: LegalDocumentId): string[] {
  return legalContent(documentId)
    .sections.filter((section) => section.needsReview)
    .map((section) => section.id)
}
