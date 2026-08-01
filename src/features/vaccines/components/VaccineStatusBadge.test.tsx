import { describe, expect, it } from 'vitest'

import { screen, renderWithProviders } from '@/test/test-utils'

import type { VaccineItem } from '../api/vaccines.schemas'
import { VaccineStatusBadge } from './VaccineStatusBadge'

function itemWithStatus(status: VaccineItem['status']): VaccineItem {
  return {
    vaccineId: 'v1',
    name: 'BCG',
    description: 'desc',
    doseNumber: 1,
    recommendedAgeInMonths: 0,
    status,
    applicationDate: status === 'APPLIED' ? '2026-01-01' : null,
    notes: null,
  }
}

describe('VaccineStatusBadge', () => {
  it('renders the delayed state distinctly from pending', () => {
    const { rerender } = renderWithProviders(<VaccineStatusBadge item={itemWithStatus('DELAYED')} />)
    expect(screen.getByText('Atrasada')).toBeInTheDocument()

    rerender(<VaccineStatusBadge item={itemWithStatus('PENDING')} />)
    expect(screen.getByText('Pendente')).toBeInTheDocument()
    expect(screen.queryByText('Atrasada')).not.toBeInTheDocument()
  })

  it('shows the application date when applied', () => {
    renderWithProviders(<VaccineStatusBadge item={itemWithStatus('APPLIED')} />)
    expect(screen.getByText(/Aplicada em/)).toBeInTheDocument()
  })
})
