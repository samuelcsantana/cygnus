import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { config } from '@/lib/config'
import { buildBaby } from '@/test/fixtures/baby'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
import { MilestonesRoute } from './MilestonesRoute'

const babyId = '11111111-1111-4111-8111-111111111111'
const otherId = '22222222-2222-4222-8222-222222222222'
const memory = {
  id: '33333333-3333-4333-8333-333333333333',
  babyId,
  title: 'Abraço na vovó',
  description: 'Uma tarde especial.',
  achievedAt: '2026-09-01',
  category: 'SOCIAL',
  photoUrl: 'https://example.com/photo.jpg',
  createdAt: '2026-09-01',
}
beforeEach(() => {
  useSelectedBabyStore.setState({ selectedBabyId: null })
  server.use(
    http.get(`${config.apiBaseUrl}/babies`, () =>
      HttpResponse.json([
        buildBaby({ id: babyId, name: 'Alice' }),
        buildBaby({ id: otherId, name: 'Pedro' }),
      ]),
    ),
    http.get(`${config.apiBaseUrl}/babies/:babyId/milestones`, ({ params }) =>
      HttpResponse.json(params.babyId === babyId ? [memory] : []),
    ),
  )
})
afterEach(() => useSelectedBabyStore.setState({ selectedBabyId: null }))
it('shows the first-memory invitation for an empty selected child', async () => {
  useSelectedBabyStore.setState({ selectedBabyId: otherId })
  renderWithProviders(<MilestonesRoute />)
  expect(await screen.findByText('Uma história começa com uma lembrança')).toBeInTheDocument()
  expect(screen.queryByText(memory.title)).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Registrar agora' }))
  expect(await screen.findByLabelText('O que aconteceu?')).toBeInTheDocument()
})
it('scopes counts and searches without accents, with a distinct category empty state', async () => {
  useSelectedBabyStore.setState({ selectedBabyId: babyId })
  const user = userEvent.setup()
  renderWithProviders(<MilestonesRoute />)
  await screen.findByRole('heading', { name: memory.title })
  expect(screen.getByRole('button', { name: 'Todos (1)' })).toBeInTheDocument()
  expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  await user.type(screen.getByRole('searchbox'), 'xyz')
  expect(await screen.findByText('Nenhuma lembrança corresponde à sua busca.')).toBeInTheDocument()
  await user.clear(screen.getByRole('searchbox'))
  await user.type(screen.getByRole('searchbox', { name: 'Buscar nas memórias…' }), 'abraco')
  await waitFor(() =>
    expect(screen.getByRole('heading', { name: memory.title })).toBeInTheDocument(),
  )
  await user.clear(screen.getByRole('searchbox'))
  await user.click(screen.getByRole('button', { name: /Motor \(0\)/ }))
  expect(await screen.findByText('Ainda não há lembranças nesta categoria.')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Limpar busca e filtros' }))
  expect(await screen.findByRole('heading', { name: memory.title })).toBeInTheDocument()
})
it('preserves another child’s memories on failure and retries the failed request', async () => {
  let failed = true
  server.use(
    http.get(`${config.apiBaseUrl}/babies/${otherId}/milestones`, () =>
      failed ? new HttpResponse(null, { status: 500 }) : HttpResponse.json([]),
    ),
  )
  renderWithProviders(<MilestonesRoute />)
  expect(await screen.findByRole('heading', { name: memory.title })).toBeInTheDocument()
  expect(await screen.findByRole('alert')).toHaveTextContent('Pedro')
  failed = false
  await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
})
it('opens the saved photo and returns to the timeline with Escape', async () => {
  const user = userEvent.setup()
  renderWithProviders(<MilestonesRoute />)
  await user.click(await screen.findByRole('button', { name: 'Ampliar foto de Abraço na vovó' }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
it('keeps deletion confirmation open after a failed request', async () => {
  server.use(
    http.delete(
      `${config.apiBaseUrl}/babies/${babyId}/milestones/${memory.id}`,
      () => new HttpResponse(null, { status: 500 }),
    ),
  )
  const user = userEvent.setup()
  renderWithProviders(<MilestonesRoute />)
  await user.click(await screen.findByRole('button', { name: /Excluir.*Abraço/ }))
  await user.click(screen.getByRole('button', { name: 'Excluir' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Excluir' })).toBeEnabled())
  expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: memory.title, hidden: true })).toBeInTheDocument()
})
