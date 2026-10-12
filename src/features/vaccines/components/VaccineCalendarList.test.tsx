import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { expect, it } from 'vitest'
import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, within } from '@/test/test-utils'
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

it('shows a registered dose where it was clicked, flashing, even when the filter no longer includes it', async () => {
  server.use(
    http.patch(`${config.apiBaseUrl}/babies/:babyId/vaccines/:vaccineId/apply`, () =>
      HttpResponse.json({ ...item, babyId: undefined, status: 'APPLIED', applicationDate: '2026-10-12' }),
    ),
  )
  const user = userEvent.setup()
  // Under the 'pending' filter an applied dose leaves the list. The parent's
  // items would drop it; here they never change, and the row must still show
  // the dose as applied, in place, for the length of the flash.
  renderWithProviders(<VaccineCalendarList items={[item]} babies={[]} filterKey="PENDING" />)
  await user.click(screen.getByRole('button', { name: 'Registrar dose' }))
  await user.click(await screen.findByRole('button', { name: 'Salvar Registro' }))

  const row = (await screen.findByText(/Aplicada/)).closest('article')!
  expect(within(row).getByText('Tríplice viral')).toBeVisible()
  expect(row).toHaveClass('animate-flash-ok')
})
