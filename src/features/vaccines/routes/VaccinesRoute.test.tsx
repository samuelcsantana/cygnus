import { useSearchDestinationStore } from '@/shared/stores/searchDestination.store'
import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders, screen } from '@/test/test-utils'
import { buildBaby } from '@/test/fixtures/baby'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
import { VaccinesRoute } from './VaccinesRoute'
const { calendar } = vi.hoisted(() => ({ calendar: vi.fn() }))
vi.mock('../api/vaccines.hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/vaccines.hooks')>()),
  useAllBabiesVaccineCalendars: calendar,
}))
vi.mock('../components/AdhocVaccineList', () => ({ AdhocVaccineList: () => null }))
const ana = buildBaby({ id: '11111111-1111-4111-8111-111111111111', name: 'Ana' })
const bruno = buildBaby({ id: '22222222-2222-4222-8222-222222222222', name: 'Bruno' })
function setup(failed = false) {
  const entries = [ana, bruno].map((baby, index) => ({
    baby,
    isPending: false,
    isError: failed && index === 1,
    groups: [],
    items: [
      {
        babyId: baby.id,
        vaccineId: baby.id,
        name: index ? 'Dose Bruno' : 'Dose Ana',
        description: 'Details',
        guidance: null,
        doseNumber: 1,
        recommendedAgeInMonths: 0,
        recommendationKind: 'ROUTINE',
        status: index ? 'APPLIED' : 'PENDING',
        applicationDate: null,
        notes: null,
        batchNumber: null,
        location: null,
        professional: null,
        photoUrl: null,
      },
    ],
  }))
  calendar.mockReturnValue({
    babies: [ana, bruno],
    perBaby: entries,
    items: entries.flatMap((e) => e.items),
    isPending: false,
    isError: failed,
    isEmpty: false,
    metadata: null,
  })
  renderWithProviders(
    <MemoryRouter>
      <VaccinesRoute />
    </MemoryRouter>,
  )
}
afterEach(() => { useSelectedBabyStore.getState().select(null); useSearchDestinationStore.getState().set(null) })
it('scopes counters, progress, cards and doses to the selected child', () => {
  useSelectedBabyStore.getState().select(ana.id)
  setup()
  expect(screen.getByText('Dose Ana')).toBeVisible()
  expect(screen.queryByText('Dose Bruno')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Tomadas.*0/ })).toBeVisible()
  expect(screen.getByText('0%')).toBeVisible()
  expect(screen.queryByRole('link', { name: /Bruno/ })).not.toBeInTheDocument()
})
it('keeps available doses visible after another child fails and offers retry', () => {
  setup(true)
  expect(screen.getByText('Dose Ana')).toBeVisible()
  expect(screen.getByRole('alert')).toHaveTextContent('Bruno')
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  expect(screen.queryByText('0%')).not.toBeInTheDocument()
})
it('does not report an unrelated child failure in an individual view', () => {
  useSelectedBabyStore.getState().select(ana.id)
  setup(true)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(screen.getByText('0%')).toBeVisible()
})

it('resolves a notification reference without requiring a dose number', () => {
  useSearchDestinationStore.getState().set({ source: 'notification', path: '/vaccines', babyId: ana.id, query: 'Dose Ana', keys: [`vaccine:${ana.id}:${ana.id}`] })
  setup()
  expect(screen.getByText('Dose Ana')).toBeVisible()
  expect(screen.queryByText('Dose Bruno')).not.toBeInTheDocument()
})
it('explains when a notification references a removed vaccine', () => {
  useSearchDestinationStore.getState().set({ source: 'notification', path: '/vaccines', babyId: ana.id, query: 'Removed', keys: ['vaccine:removed'] })
  setup()
  expect(screen.getByRole('status')).toHaveTextContent('Este registro não está mais disponível.')
})
