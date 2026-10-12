import { useEffect } from 'react'

import { config } from '@/lib/config'

/**
 * Starts waking the API the moment a public screen opens.
 *
 * The free Render instance takes about a minute to come back from sleep. A
 * visitor spends some of that minute reading the page or typing an e-mail, so
 * asking `/health` on arrival means the server is often up by the time they
 * press anything. Fire and forget: the answer is not used, a failure is not an
 * error, and no cookie goes with it.
 */
export function useWakeApi() {
  useEffect(() => {
    void fetch(`${config.apiBaseUrl}/health`, { credentials: 'omit' }).catch(() => undefined)
  }, [])
}
