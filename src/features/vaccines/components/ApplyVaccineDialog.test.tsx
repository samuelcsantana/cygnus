import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'

import type { VaccineItem } from '../api/vaccines.schemas'
import { ApplyVaccineDialog } from './ApplyVaccineDialog'

const sampleItem: VaccineItem = {
  vaccineId: '11111111-1111-4111-8111-111111111111',
  name: 'Hepatite B',
  description: 'Protects against hepatitis B.',
  doseNumber: 1,
  recommendedAgeInMonths: 0,
  status: 'PENDING',
  applicationDate: null,
  notes: null,
}

describe('ApplyVaccineDialog', () => {
  it('shows an inline error when the apply request fails, instead of failing silently', async () => {
    server.use(
      http.patch(`${config.apiBaseUrl}/babies/:babyId/vaccines/:vaccineId/apply`, () =>
        HttpResponse.json({ status: 'error', message: 'Internal error' }, { status: 500 }),
      ),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    renderWithProviders(<ApplyVaccineDialog babyId="baby-1" item={sampleItem} onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: 'Salvar Registro' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Não foi possível registrar a vacina. Tente novamente.',
      )
    })

    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('closes the dialog and clears the error on a successful apply', async () => {
    server.use(
      http.patch(`${config.apiBaseUrl}/babies/:babyId/vaccines/:vaccineId/apply`, () =>
        HttpResponse.json({ ...sampleItem, status: 'APPLIED', applicationDate: '2026-01-01' }),
      ),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    renderWithProviders(<ApplyVaccineDialog babyId="baby-1" item={sampleItem} onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: 'Salvar Registro' }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
