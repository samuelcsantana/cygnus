import { z } from 'zod'

import { LEGAL_DOCUMENTS } from '@/shared/legal'

const documentIds = Object.keys(LEGAL_DOCUMENTS) as [keyof typeof LEGAL_DOCUMENTS, ...(keyof typeof LEGAL_DOCUMENTS)[]]

export const legalDocumentIdSchema = z.enum(documentIds)

/**
 * One acceptance, as the API records it.
 *
 * `version` is part of the identity of the record, not a column beside it: the
 * unique key on the API side is (user, document, version), so accepting 2.0.0
 * does not erase the row for 1.0.0. Who agreed to which text, and when, is
 * history — that is what makes the consent auditable instead of a boolean with
 * no date.
 */
export const legalAcceptanceSchema = z.object({
  documentId: legalDocumentIdSchema,
  version: z.string(),
  acceptedAt: z.string(),
})
export type LegalAcceptance = z.infer<typeof legalAcceptanceSchema>

export const legalAcceptanceListSchema = z.array(legalAcceptanceSchema)

export const recordAcceptanceSchema = z.object({
  documentId: legalDocumentIdSchema,
  version: z.string().min(1).max(64),
})
export type RecordAcceptanceInput = z.infer<typeof recordAcceptanceSchema>
