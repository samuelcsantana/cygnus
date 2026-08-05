import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'

import type { Milestone } from '../api/milestones.schemas'
import { EditMilestoneDialog } from './EditMilestoneDialog'

const babyId = '22222222-2222-4222-8222-222222222222'

const sampleMilestone: Milestone = {
  id: '11111111-1111-4111-8111-111111111111',
  babyId,
  title: 'Primeiro sorriso',
  description: null,
  achievedAt: '2026-01-10',
  category: 'SOCIAL',
  photoUrl: null,
  createdAt: '2026-01-10T00:00:00.000Z',
}

describe('EditMilestoneDialog', () => {
  it('shows an inline error when the update request fails, instead of failing silently', async () => {
    server.use(
      http.patch(`${config.apiBaseUrl}/babies/:babyId/milestones/:milestoneId`, () =>
        HttpResponse.json({ status: 'error', message: 'Internal error' }, { status: 500 }),
      ),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    renderWithProviders(
      <EditMilestoneDialog babyId={babyId} birthDate="2025-06-01" milestone={sampleMilestone} onOpenChange={onOpenChange} />,
    )

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar o marco. Tente novamente.')
    })

    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('closes the dialog on a successful update', async () => {
    server.use(
      http.patch(`${config.apiBaseUrl}/babies/:babyId/milestones/:milestoneId`, () =>
        HttpResponse.json({ ...sampleMilestone, title: 'Primeiro sorriso largo' }),
      ),
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    renderWithProviders(
      <EditMilestoneDialog babyId={babyId} birthDate="2025-06-01" milestone={sampleMilestone} onOpenChange={onOpenChange} />,
    )

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('pre-fills the form with the milestone being edited', () => {
    renderWithProviders(
      <EditMilestoneDialog babyId={babyId} birthDate="2025-06-01" milestone={sampleMilestone} onOpenChange={vi.fn()} />,
    )

    expect(screen.getByLabelText('O que aconteceu?')).toHaveValue('Primeiro sorriso')
    expect(screen.getByLabelText('Data')).toHaveValue('10-01-2026')
  })
})
