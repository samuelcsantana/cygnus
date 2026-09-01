import { httpClient } from '@/lib/http-client'

import {
  legalAcceptanceListSchema,
  legalAcceptanceSchema,
  recordAcceptanceSchema,
  type LegalAcceptance,
  type RecordAcceptanceInput,
} from './legal.schemas'

export async function fetchLegalAcceptances(): Promise<LegalAcceptance[]> {
  const response = await httpClient.get<unknown>('/legal/acceptances')
  return legalAcceptanceListSchema.parse(response)
}

export async function recordLegalAcceptance(input: RecordAcceptanceInput): Promise<LegalAcceptance> {
  const body = recordAcceptanceSchema.parse(input)
  const response = await httpClient.post<unknown>('/legal/acceptances', body)
  return legalAcceptanceSchema.parse(response)
}
