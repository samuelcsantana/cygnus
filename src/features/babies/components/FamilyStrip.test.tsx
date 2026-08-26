import { describe, expect, it } from 'vitest'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { renderWithProviders, screen } from '@/test/test-utils'

import { FamilyStrip } from './FamilyStrip'

const baby: Baby = {
  id: '00000000-0000-0000-0000-000000000001',
  userId: '00000000-0000-0000-0000-0000000000ff',
  name: 'Ana',
  birthDate: '2026-06-01',
  gender: 'FEMALE',
  bloodType: null,
  allergies: [],
  avatarUrl: null,
  avatarColor: null,
  createdAt: '2026-06-01T00:00:00.000Z',
}

const UP_TO_DATE = 'Vacinas em dia'

/**
 * O chip resume o estado de vacinação de uma criança em três palavras, e a
 * pessoa que lê decide se precisa agir.
 *
 * O caso perigoso não é o erro visível — é o silêncio: quando o calendário não
 * carrega, a contagem de atrasadas é zero **pelo mesmo motivo que seria zero se
 * estivesse tudo em dia**. Sem separar "nenhuma atrasada" de "não sei", o app
 * afirma que a criança está protegida sem ter olhado. Num app de calendário
 * vacinal isso é pior do que não mostrar nada.
 */
describe('FamilyStrip: o que o chip afirma sobre vacinas', () => {
  it('não diz "em dia" quando o calendário não carregou', () => {
    renderWithProviders(
      <FamilyStrip items={[{ baby, delayedVaccineCount: 0, vaccineStatusKnown: false }]} onEdit={() => {}} />,
    )

    expect(screen.queryByText(UP_TO_DATE)).not.toBeInTheDocument()
    expect(screen.getByText('Não foi possível verificar as vacinas')).toBeInTheDocument()
  })

  it('diz "em dia" quando o calendário carregou e não há atrasadas', () => {
    renderWithProviders(
      <FamilyStrip items={[{ baby, delayedVaccineCount: 0, vaccineStatusKnown: true }]} onEdit={() => {}} />,
    )

    expect(screen.getByText(UP_TO_DATE)).toBeInTheDocument()
  })

  it('reporta o atraso conhecido, que é verdadeiro sempre que existe', () => {
    renderWithProviders(
      <FamilyStrip items={[{ baby, delayedVaccineCount: 3, vaccineStatusKnown: true }]} onEdit={() => {}} />,
    )

    expect(screen.getByText(/3/)).toBeInTheDocument()
    expect(screen.queryByText(UP_TO_DATE)).not.toBeInTheDocument()
  })
})
