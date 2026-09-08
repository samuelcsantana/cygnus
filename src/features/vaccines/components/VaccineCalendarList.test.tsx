import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { renderWithProviders, screen } from '@/test/test-utils'
import { VaccineCalendarList } from './VaccineCalendarList'
const item = {
  babyId: '11111111-1111-4111-8111-111111111111',
  vaccineId: '22222222-2222-4222-8222-222222222222',
  name: 'Tríplice viral',
  description: 'Proteção',
  guidance: null,
  doseNumber: 1,
  recommendedAgeInMonths: 12,
  recommendationKind: 'ROUTINE' as const,
  status: 'PENDING' as const,
  applicationDate: null,
  notes: null,
  batchNumber: null,
  location: null,
  professional: null,
  photoUrl: null,
}
it('matches accents and repeated spaces, reports the status filter and restores focus when cleared', async () => {
  const user = userEvent.setup()
  renderWithProviders(<VaccineCalendarList items={[item]} babies={[]} filterKey="PENDING" />)
  const search = screen.getByRole('searchbox')
  await user.type(search, '  triplice   viral ')
  expect(await screen.findByText(/1 resultado/)).toHaveTextContent('Filtro: Pendente')
  expect(screen.getByText('Tríplice viral')).toBeVisible()
  await user.clear(search)
  await user.type(search, 'inexistente')
  expect(await screen.findByText(/0 resultados/)).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Limpar busca' }))
  expect(search).toHaveFocus()
  expect(search).toHaveValue('')
  expect(await screen.findByText('Tríplice viral')).toBeVisible()
})
