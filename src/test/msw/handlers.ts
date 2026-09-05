import { HttpResponse, http } from 'msw'

import { config } from '@/lib/config'

const api = (path: string) => `${config.apiBaseUrl}${path}`

/**
 * Sane defaults so components under test don't crash on unrelated requests.
 * Individual tests override the endpoint they care about via `server.use()`.
 */
export const handlers = [
  http.get(api('/babies'), () => HttpResponse.json([])),
  http.get(api('/notifications'), () => HttpResponse.json([])),
  http.get(api('/specialties'), () => HttpResponse.json(['Pediatria', 'Cardiologia Pediátrica', 'Odontopediatria'])),
  // The account's saved professionals — not the same thing as `/specialties`, which is the static
  // reference list of what a professional does.
  http.get(api('/specialists'), () => HttpResponse.json([])),
  http.get(api('/babies/:babyId/medications'), () => HttpResponse.json([])),
  http.get(api('/auth/me'), () =>
    HttpResponse.json({
      id: '00000000-0000-0000-0000-000000000000',
      email: 'parent@example.com',
      name: 'Parent',
      createdAt: '2024-01-01T00:00:00.000Z',
    }),
  ),
]
