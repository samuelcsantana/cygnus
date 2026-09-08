import { afterAll, afterEach, beforeAll, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'
import { server } from '@/test/msw/server'
import { config } from '@/lib/config'
import { buildBaby } from '@/test/fixtures/baby'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
import { useSearchDestinationStore } from '@/shared/stores/searchDestination.store'
import { NotificationsRoute } from './NotificationsRoute'
import type { Notification } from '../api/notifications.schemas'

// jsdom lacks the pointer-capture and scrolling APIs used by Radix Select.
const browserMethods = ['hasPointerCapture', 'setPointerCapture', 'releasePointerCapture', 'scrollIntoView'] as const
beforeAll(() => {
  for (const method of browserMethods) {
    Object.defineProperty(HTMLElement.prototype, method, { configurable: true, value: () => false })
  }
})
afterAll(() => {
  for (const method of browserMethods) Reflect.deleteProperty(HTMLElement.prototype, method)
})

const ana = buildBaby({ name: 'Ana' })
const bruno = buildBaby({
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Bruno',
})
const first: Notification = {
  id: '33333333-3333-4333-8333-333333333333',
  babyId: ana.id,
  type: 'APPOINTMENT_UPCOMING',
  referenceId: 'appointment-1',
  title: 'Consulta da Ana',
  message: 'Consulta em 2026-09-10T15:00:00.000Z.',
  readAt: null,
  createdAt: '2026-09-08T12:00:00Z',
}
const second: Notification = {
  ...first,
  id: '44444444-4444-4444-8444-444444444444',
  babyId: bruno.id,
  type: 'VACCINE_DELAYED',
  referenceId: 'vaccine-2',
  title: 'Vacina do Bruno',
}
function setup(options: { fail?: string; error?: boolean } = {}) {
  let items = [{ ...first }, { ...second }]
  const requests: string[] = []
  server.use(
    http.get(`${config.apiBaseUrl}/babies`, () => HttpResponse.json([ana, bruno])),
    http.get(`${config.apiBaseUrl}/notifications`, () =>
      options.error ? HttpResponse.json({}, { status: 500 }) : HttpResponse.json(items),
    ),
    http.patch(`${config.apiBaseUrl}/notifications/:id/read`, ({ params }) => {
      requests.push(String(params.id))
      if (params.id === options.fail) return HttpResponse.json({}, { status: 500 })
      items = items.map((item) =>
        item.id === params.id ? { ...item, readAt: '2026-09-08T13:00:00Z' } : item,
      )
      return HttpResponse.json(items.find((item) => item.id === params.id))
    }),
  )
  renderWithProviders(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<NotificationsRoute />} />
        <Route path="/appointments" element={<p>Appointment destination</p>} />
        <Route path="/vaccines" element={<p>Vaccine destination</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return requests
}
afterEach(() => {
  useSelectedBabyStore.getState().select(null)
  useSearchDestinationStore.getState().set(null)
})
it('filters by child and marks only the filtered unread notifications', async () => {
  const requests = setup()
  const user = userEvent.setup()
  await screen.findByText('Consulta da Ana')
  await user.click(screen.getByRole('combobox', { name: 'Criança' }))
  await user.click(screen.getByRole('option', { name: 'Ana' }))
  expect(screen.queryByText('Vacina do Bruno')).not.toBeInTheDocument()
  await user.click(screen.getByLabelText('Somente não lidas'))
  await user.click(screen.getByRole('button', { name: 'Marcar todas desta lista como lidas' }))
  await screen.findByText('Nenhuma notificação não lida')
  expect(requests).toEqual([first.id])
  await user.click(screen.getByRole('combobox', { name: 'Criança' }))
  await user.click(screen.getByRole('option', { name: 'Todas as crianças' }))
  expect(await screen.findByText('Vacina do Bruno')).toBeVisible()
})
it('preserves successful updates and retries only unread items after a partial failure', async () => {
  const requests = setup({ fail: second.id })
  const user = userEvent.setup()
  await screen.findByText('Consulta da Ana')
  await user.click(screen.getByRole('button', { name: 'Marcar todas desta lista como lidas' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível marcar 1')
  expect(screen.getByText('Lida')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Marcar todas desta lista como lidas' }))
  await waitFor(() => expect(requests).toEqual([first.id, second.id, second.id]))
})
it.each([
  ['Ver consulta', 'Appointment destination', first, 'appointment:appointment-1'],
  ['Ver vacina', 'Vaccine destination', second, `vaccine:${bruno.id}:vaccine-2`],
] as const)(
  'opens %s in the correct child context without silently marking it read',
  async (label, destination, item, key) => {
    const requests = setup()
    await userEvent.click(await screen.findByRole('button', { name: label }))
    expect(await screen.findByText(destination)).toBeVisible()
    expect(useSelectedBabyStore.getState().selectedBabyId).toBe(item.babyId)
    expect(useSearchDestinationStore.getState().target?.keys).toEqual([key])
    expect(requests).toEqual([])
  },
)
it('formats appointment timestamps in the local timezone', async () => {
  setup()
  await screen.findByText('Consulta da Ana')
  expect(screen.getAllByText(/10\/09\/2026, 12:00/)).toHaveLength(2)
  expect(screen.queryByText(/15:00:00/)).not.toBeInTheDocument()
})
it('offers retry when loading fails instead of showing an empty state', async () => {
  setup({ error: true })
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar')
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  expect(screen.queryByText('Tudo em dia por aqui')).not.toBeInTheDocument()
})
