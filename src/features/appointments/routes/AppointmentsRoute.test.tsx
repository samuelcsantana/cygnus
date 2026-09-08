import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders, screen } from '@/test/test-utils'
import { buildBaby } from '@/test/fixtures/baby'
import { buildAppointment } from '@/test/fixtures/appointment'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
import { AppointmentsRoute } from './AppointmentsRoute'
const { all } = vi.hoisted(() => ({ all: vi.fn() }))
vi.mock('../api/appointments.hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/appointments.hooks')>()),
  useAllBabiesAppointments: all,
}))
function setup(failed = false) {
  const ana = buildBaby({ id: 'ana', name: 'Ana' }),
    bruno = buildBaby({ id: 'bruno', name: 'Bruno' })
  const perBaby = [ana, bruno].map((baby, index) => ({
    baby,
    isPending: false,
    isError: failed && index === 1,
    items: [
      buildAppointment({
        id: baby.id,
        babyId: baby.id,
        doctorName: `Dra. ${baby.name}`,
        scheduledAt: '2099-01-01T10:00:00Z',
      }),
    ],
  }))
  all.mockReturnValue({
    babies: [ana, bruno],
    perBaby,
    isEmpty: false,
    isPending: false,
    isError: failed,
    items: perBaby.flatMap((e) => e.items),
  })
  renderWithProviders(
    <MemoryRouter>
      <AppointmentsRoute />
    </MemoryRouter>,
  )
}
afterEach(() => useSelectedBabyStore.getState().select(null))
it('scopes the cards and filter counts to the selected child', () => {
  useSelectedBabyStore.getState().select('ana')
  setup()
  expect(screen.getByRole('button', { name: 'Próximas (1)' })).toBeVisible()
  expect(screen.getByText('Dra. Ana')).toBeVisible()
  expect(screen.queryByText('Dra. Bruno')).not.toBeInTheDocument()
})
it('keeps successful records available when another child fails', () => {
  setup(true)
  expect(screen.getByText('Dra. Ana')).toBeVisible()
  expect(screen.getByRole('alert')).toHaveTextContent('Bruno')
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
})
