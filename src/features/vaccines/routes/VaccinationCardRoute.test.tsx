import { afterEach, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { renderWithProviders, screen } from '@/test/test-utils'
import { buildBaby } from '@/test/fixtures/baby'
import { VaccinationCardRoute } from './VaccinationCardRoute'
const { babies, calendar, adhoc } = vi.hoisted(() => ({
  babies: vi.fn(),
  calendar: vi.fn(),
  adhoc: vi.fn(),
}))
vi.mock('@/features/babies/api/babies.hooks', () => ({ useBabies: babies }))
vi.mock('../api/vaccines.hooks', () => ({ useVaccineCalendar: calendar, useAdhocVaccines: adhoc }))
const baby = buildBaby({ name: 'Alice' })
const record = {
  vaccineId: 'v1',
  name: 'BCG',
  doseNumber: 1,
  status: 'APPLIED',
  applicationDate: '2026-08-20',
  batchNumber: 'AB123',
  location: 'UBS Centro',
  professional: null,
  notes: null,
  photoUrl: null,
}
function setup(mode = 'ready') {
  babies.mockReturnValue({
    data: mode === 'missing' ? [] : [baby],
    isPending: false,
    isError: mode === 'error',
    refetch: vi.fn(),
  })
  calendar.mockReturnValue({
    data: {
      groups: [
        {
          items: [
            record,
            {
              ...record,
              vaccineId: 'v2',
              name: 'Hepatite A',
              status: 'PENDING',
              applicationDate: null,
            },
          ],
        },
      ],
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  })
  adhoc.mockReturnValue({ data: [], isPending: false, isError: false, refetch: vi.fn() })
  renderWithProviders(
    <MemoryRouter initialEntries={[`/vaccines/${baby.id}/card`]}>
      <Routes>
        <Route path="/vaccines/:babyId/card" element={<VaccinationCardRoute />} />
      </Routes>
    </MemoryRouter>,
  )
}
afterEach(() => vi.restoreAllMocks())
it('prints only applied records by default and includes the calendar on request', async () => {
  setup()
  const user = userEvent.setup()
  const print = vi.spyOn(window, 'print').mockImplementation(() => {})
  expect(screen.getByRole('heading', { name: 'Alice' })).toBeVisible()
  const upcoming = screen
    .getByRole('heading', { name: /Calendário a acompanhar/ })
    .closest('section')!.parentElement!
  expect(upcoming).toHaveClass('print:hidden')
  await user.click(screen.getByRole('radio', { name: 'Incluir calendário a acompanhar' }))
  expect(upcoming).not.toHaveClass('print:hidden')
  await user.click(screen.getByRole('button', { name: 'Imprimir / Salvar PDF' }))
  expect(print).toHaveBeenCalledOnce()
})
it('blocks unidentified documents and offers retry when child data fails', () => {
  setup('error')
  expect(screen.getByRole('alert')).toBeVisible()
  expect(screen.getByRole('button', { name: 'Imprimir / Salvar PDF' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  expect(screen.queryByRole('heading', { name: 'Alice' })).not.toBeInTheDocument()
})
it('shows child not found and does not request a calendar without a known child', () => {
  setup('missing')
  expect(screen.getByRole('status')).toHaveTextContent('Criança não encontrada')
  expect(calendar).toHaveBeenLastCalledWith(null)
  expect(screen.getByRole('button', { name: 'Imprimir / Salvar PDF' })).toBeDisabled()
})
