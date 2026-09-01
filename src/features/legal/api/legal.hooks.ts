import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { LEGAL_DOCUMENTS, type LegalDocument, type LegalDocumentId } from '@/shared/legal'

import { fetchLegalAcceptances, recordLegalAcceptance } from './legal.api'
import type { LegalAcceptance } from './legal.schemas'

export const legalAcceptancesQueryKey = ['legal', 'acceptances'] as const

/**
 * The documents that are actually in force right now.
 *
 * While every document is a draft this is empty, and that emptiness is what
 * makes the whole gate inert: no request goes out, nothing is asked, nothing
 * blocks. Asking someone to accept a draft would be asking them to agree to
 * text nobody has stood behind — the API could record it, but recording a
 * consent that means nothing is worse than having none.
 */
export function documentsInForce(): LegalDocument[] {
  return Object.values(LEGAL_DOCUMENTS).filter((document) => document.status === 'in-force')
}

/**
 * Of the in-force documents, the ones this user has not accepted **at the
 * current version**.
 *
 * Version-aware on purpose: an acceptance of 1.0.0 does not satisfy 2.0.0. That
 * is the same rule the API enforces on its unique key, and it is what makes a
 * text change re-ask rather than silently inherit an old agreement.
 */
export function documentsAwaitingAcceptance(acceptances: LegalAcceptance[] | undefined): LegalDocument[] {
  if (!acceptances) return []

  return documentsInForce().filter(
    (document) =>
      !acceptances.some(
        (acceptance) => acceptance.documentId === document.id && acceptance.version === document.version,
      ),
  )
}

export function useLegalAcceptances() {
  return useQuery({
    queryKey: legalAcceptancesQueryKey,
    queryFn: fetchLegalAcceptances,
    // No document in force means there is nothing this answer could change, so
    // the request is not made at all. Today that is every case.
    enabled: documentsInForce().length > 0,
  })
}

export function useRecordLegalAcceptance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId: LegalDocumentId) =>
      recordLegalAcceptance({ documentId, version: LEGAL_DOCUMENTS[documentId].version }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: legalAcceptancesQueryKey }),
  })
}
