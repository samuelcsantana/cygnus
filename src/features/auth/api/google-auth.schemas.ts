import { z } from 'zod'

export const googleStatusSchema = z.object({ enabled: z.boolean() })
export const googleStartSchema = z.object({ url: z.string().url().refine((value) => {
  const url = new URL(value)
  return url.origin === 'https://accounts.google.com' && url.pathname === '/o/oauth2/v2/auth'
}) })
