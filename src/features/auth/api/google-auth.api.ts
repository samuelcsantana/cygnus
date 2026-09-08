import { httpClient } from '@/lib/http-client'
import { googleStartSchema, googleStatusSchema } from './google-auth.schemas'

export async function getGoogleStatus() {
  return googleStatusSchema.parse(await httpClient.get<unknown>('/auth/google/status'))
}

export async function startGoogleSignIn(): Promise<string> {
  const result = googleStartSchema.parse(await httpClient.post<unknown>('/auth/google/start'))
  return result.url
}
